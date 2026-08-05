import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * Things that genuinely need someone's attention, computed from live rows.
 *
 * Not a notifications table — nothing writes to one, and a table nobody writes
 * to is an inbox that is permanently empty. These are derived from the same
 * data the rest of the admin reads, so an item appears the moment the
 * condition becomes true and disappears the moment it is resolved. Nothing has
 * to remember to mark it read.
 */

export type AttentionKind = "invoice" | "review" | "credential" | "access" | "content";
export type AttentionSeverity = "critical" | "warning" | "info";

export type AttentionItem = {
  id: string;
  kind: AttentionKind;
  severity: AttentionSeverity;
  title: string;
  detail: string;
  href: string;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export async function listAttentionItems(): Promise<AttentionItem[]> {
  noStore();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [invoicesRes, reviewsRes, credentialsRes, profilesRes, pagesRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, number, due_date, status, organizations ( name )")
      .not("due_date", "is", null)
      .lt("due_date", today)
      .not("status", "in", '("paid","void")'),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("credential_rotation")
      .select("credential_id, rotation_state, days_remaining")
      .eq("rotation_state", "overdue"),
    supabase
      .from("profiles")
      .select("id, email")
      .eq("portal", "ADMIN")
      .eq("is_active", true)
      .is("role_id", null),
    supabase.from("pages").select("id, title, slug, status").eq("status", "draft"),
  ]);

  const items: AttentionItem[] = [];

  // Outstanding balances are read from the totals view rather than assumed, so
  // an invoice already settled in full never appears here.
  const overdue = (invoicesRes.data ?? []) as Array<{
    id: string;
    number: string;
    due_date: string;
    organizations: { name: string } | null;
  }>;

  if (overdue.length > 0) {
    const { data: totals } = await supabase
      .from("invoice_totals")
      .select("invoice_id, outstanding")
      .in("invoice_id", overdue.map((i) => i.id));

    const outstanding = new Map(
      (totals ?? []).map((t) => [t.invoice_id as string, Number(t.outstanding ?? 0)])
    );

    for (const inv of overdue) {
      const balance = outstanding.get(inv.id) ?? 0;
      if (balance <= 0) continue;
      const days = Math.floor(
        (Date.now() - new Date(inv.due_date).getTime()) / 86_400_000
      );
      items.push({
        id: `invoice:${inv.id}`,
        kind: "invoice",
        severity: days > 30 ? "critical" : "warning",
        title: `${inv.number} is ${days} days overdue`,
        detail: `${money.format(balance)} outstanding${
          inv.organizations ? ` from ${inv.organizations.name}` : ""
        }.`,
        href: "/admin/invoices",
      });
    }
  }

  const pendingReviews = reviewsRes.count ?? 0;
  if (pendingReviews > 0) {
    items.push({
      id: "reviews:pending",
      kind: "review",
      severity: "info",
      title: `${pendingReviews} review${pendingReviews === 1 ? "" : "s"} awaiting moderation`,
      detail: "Nothing reaches the public page until it is published.",
      href: "/admin/reviews",
    });
  }

  const staleKeys = (credentialsRes.data ?? []).length;
  if (staleKeys > 0) {
    items.push({
      id: "credentials:overdue",
      kind: "credential",
      severity: "critical",
      title: `${staleKeys} API key${staleKeys === 1 ? "" : "s"} past the rotation window`,
      detail: "Issue replacements at the provider, then record the rotation.",
      href: "/admin/keys",
    });
  }

  for (const p of (profilesRes.data ?? []) as { id: string; email: string }[]) {
    items.push({
      id: `access:${p.id}`,
      kind: "access",
      severity: "warning",
      title: `${p.email} has admin access with no role`,
      detail: "They reach the admin shell but every screen inside it refuses them.",
      href: "/admin/settings/users",
    });
  }

  const drafts = (pagesRes.data ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
  }>;
  if (drafts.length > 0) {
    items.push({
      id: "content:drafts",
      kind: "content",
      severity: "info",
      title: `${drafts.length} page${drafts.length === 1 ? "" : "s"} in draft`,
      detail: drafts
        .slice(0, 3)
        .map((d) => d.title)
        .join(", "),
      href: "/admin/content/pages",
    });
  }

  const rank: Record<AttentionSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
