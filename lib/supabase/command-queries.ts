import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * Entries for the ⌘K palette, built from rows that actually exist.
 *
 * The list this replaces was hardcoded in DashboardHeader and shipped to both
 * shells: it named a "Halcyon" client, an invoice INV-2043 and a staff member
 * that appeared nowhere else in the database. Searching for a real record found
 * nothing; searching for a fictional one jumped to a 404.
 *
 * Icons are named rather than imported, because this module is read by a server
 * component and the palette is a client one — passing a component across that
 * boundary is not serialisable.
 */

export type PaletteItem = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
  icon: "project" | "client" | "person" | "invoice" | "page" | "help";
};

export async function listCommandItems(): Promise<PaletteItem[]> {
  noStore();
  const supabase = await createClient();

  // RLS scopes each of these to what the caller may see, so the palette can
  // never surface a record the user would be bounced away from.
  const [{ data: projects }, { data: orgs }, { data: staff }, { data: invoices }, { data: pages }] =
    await Promise.all([
      supabase.from("projects").select("id, name, slug, status").order("name").limit(25),
      supabase.from("organizations").select("id, name, slug").order("name").limit(25),
      supabase.from("public_staff").select("id, slug, full_name, display_role").limit(25),
      supabase
        .from("invoices")
        .select("id, number, status")
        .order("issue_date", { ascending: false })
        .limit(15),
      supabase
        .from("pages")
        .select("id, title, slug")
        .order("updated_at", { ascending: false })
        .limit(15),
    ]);

  const items: PaletteItem[] = [];

  for (const p of projects ?? []) {
    items.push({
      id: `project-${p.id}`,
      group: "Projects",
      label: p.name,
      hint: p.status,
      href: `/admin/projects/${p.slug}`,
      icon: "project",
    });
  }

  for (const o of orgs ?? []) {
    items.push({
      id: `client-${o.id}`,
      group: "Clients",
      label: o.name,
      href: "/admin/clients",
      icon: "client",
    });
  }

  for (const s of staff ?? []) {
    items.push({
      id: `staff-${s.id}`,
      group: "People",
      label: (s.full_name as string) ?? "",
      hint: (s.display_role as string) ?? undefined,
      href: "/admin/staff",
      icon: "person",
    });
  }

  for (const i of invoices ?? []) {
    items.push({
      id: `invoice-${i.id}`,
      group: "Invoices",
      label: i.number,
      hint: i.status,
      href: "/admin/invoices",
      icon: "invoice",
    });
  }

  for (const p of pages ?? []) {
    items.push({
      id: `page-${p.id}`,
      group: "Pages",
      label: p.title,
      hint: `/${p.slug}`,
      href: `/admin/content/pages/${p.id}`,
      icon: "page",
    });
  }

  return items;
}
