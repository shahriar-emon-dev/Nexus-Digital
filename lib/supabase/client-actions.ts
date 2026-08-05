"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Client accounts.
 *
 * Revenue and project counts are read from views, never stored on the row.
 * The screen this replaces hardcoded eight clients with MRR figures that
 * existed nowhere else — a stored copy of a derivable number is a copy that
 * starts disagreeing with the ledger the first time an invoice changes.
 */

export type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
export type AccountHealth = Database["public"]["Enums"]["account_health"];

export type ClientAccount = OrganizationRow & {
  manager: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  revenue: {
    billed: number;
    collected: number;
    outstanding: number;
    monthlyAverage: number;
    invoiceCount: number;
  };
  projects: { total: number; active: number };
  contacts: number;
};

export async function listClients(): Promise<ClientAccount[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("organizations")
    .select("*, manager:profiles!organizations_account_manager_id_fkey ( id, full_name, email, avatar_url )")
    .order("name");

  const rows = (data ?? []) as unknown as Array<
    OrganizationRow & { manager: ClientAccount["manager"] }
  >;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // Views cannot be embedded — PostgREST resolves embeds through foreign key
  // metadata a view does not carry — so these are separate reads.
  const [revenueRes, projectsRes, contactsRes] = await Promise.all([
    supabase.from("client_revenue").select("*").in("organization_id", ids),
    supabase.from("client_project_counts").select("*").in("organization_id", ids),
    supabase.from("profiles").select("organization_id").in("organization_id", ids),
  ]);

  const revenue = new Map(
    (revenueRes.data ?? []).map((r) => [
      r.organization_id as string,
      {
        billed: Number(r.billed_total ?? 0),
        collected: Number(r.collected_total ?? 0),
        outstanding: Number(r.outstanding_total ?? 0),
        monthlyAverage: Number(r.monthly_average ?? 0),
        invoiceCount: Number(r.invoice_count ?? 0),
      },
    ])
  );

  const projects = new Map(
    (projectsRes.data ?? []).map((r) => [
      r.organization_id as string,
      { total: Number(r.project_count ?? 0), active: Number(r.active_project_count ?? 0) },
    ])
  );

  const contacts = new Map<string, number>();
  for (const p of contactsRes.data ?? []) {
    const key = p.organization_id as string;
    contacts.set(key, (contacts.get(key) ?? 0) + 1);
  }

  return rows.map((r) => ({
    ...r,
    revenue:
      revenue.get(r.id) ??
      { billed: 0, collected: 0, outstanding: 0, monthlyAverage: 0, invoiceCount: 0 },
    projects: projects.get(r.id) ?? { total: 0, active: 0 },
    contacts: contacts.get(r.id) ?? 0,
  }));
}

export async function listAccountManagers(): Promise<
  { id: string; full_name: string; email: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("portal", ["STAFF", "ADMIN"])
    .eq("is_active", true)
    .order("full_name");
  return (data ?? []) as { id: string; full_name: string; email: string }[];
}

/* ------------------------------------------------------------ mutations -- */

type Result = { ok: true } | { error: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function read(form: FormData) {
  return {
    name: String(form.get("name") ?? "").trim(),
    industry: String(form.get("industry") ?? "").trim() || null,
    health: String(form.get("health") ?? "onboarding") as AccountHealth,
    account_manager_id: String(form.get("managerId") ?? "").trim() || null,
    renews_on: String(form.get("renewsOn") ?? "").trim() || null,
    website: String(form.get("website") ?? "").trim() || null,
    notes: String(form.get("notes") ?? "").trim() || null,
  };
}

export async function createOrganization(form: FormData): Promise<Result> {
  const supabase = await createClient();
  const values = read(form);
  if (values.name.length < 2) return { error: "Give the client a name." };

  const base = slugify(values.name) || "client";
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const { data: taken } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!taken) break;
    slug = `${base}-${n}`;
  }

  const { error } = await supabase.from("organizations").insert({ ...values, slug });
  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function updateOrganization(id: string, form: FormData): Promise<Result> {
  const supabase = await createClient();
  const values = read(form);
  if (values.name.length < 2) return { error: "Give the client a name." };

  const { error } = await supabase.from("organizations").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function setOrganizationHealth(id: string, health: AccountHealth): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ health }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function deleteOrganization(id: string): Promise<Result> {
  const supabase = await createClient();

  // Refused rather than cascaded. Deleting a client takes its projects and
  // invoices with it, which is an accounting record — that has to be a
  // deliberate act on each one, not a side effect of tidying a list.
  const [{ count: projectCount }, { count: invoiceCount }] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("organization_id", id),
  ]);

  if ((projectCount ?? 0) > 0 || (invoiceCount ?? 0) > 0) {
    return {
      error:
        `This client still has ${projectCount ?? 0} project(s) and ${invoiceCount ?? 0} invoice(s). ` +
        "Mark them churned instead — deleting would take the billing record with it.",
    };
  }

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  return { ok: true };
}
