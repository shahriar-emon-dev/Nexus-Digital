import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * The client's own billing, read from Postgres.
 *
 * `lib/invoices.ts` held eleven invented invoices with their own totals and a
 * `billingSummary` constant, so every client saw the same fictional ledger —
 * including "INV-2043 overdue, $12,400", which the shell also quoted in its
 * notification bell.
 *
 * RLS scopes these to the caller's organisation, so there is no org filter in
 * the query. Totals come from `invoice_totals`, which computes them from the
 * line items — the invoices table stores no total, and summing it in TypeScript
 * would be a second implementation of the same arithmetic.
 */

export type ClientInvoice = {
  id: string;
  number: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid: number;
  outstanding: number;
  /** True when unpaid and the due date has passed. Derived, never stored. */
  isOverdue: boolean;
};

export type BillingSummary = {
  outstanding: number;
  paidToDate: number;
  overdueCount: number;
  nextDue: { number: string; dueDate: string; total: number } | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export async function listClientInvoices(): Promise<ClientInvoice[]> {
  noStore();
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, number, status, issue_date, due_date, currency")
    .order("issue_date", { ascending: false });

  const rows = invoices ?? [];
  if (rows.length === 0) return [];

  // Second query, not an embed: invoice_totals is a view and PostgREST has no
  // foreign-key metadata to join one inline.
  const { data: totals } = await supabase
    .from("invoice_totals")
    .select("invoice_id, subtotal, tax, discount, total, paid, outstanding")
    .in("invoice_id", rows.map((i) => i.id));

  const byInvoice = new Map((totals ?? []).map((t) => [t.invoice_id, t]));
  const today = todayISO();

  return rows.map((i) => {
    const t = byInvoice.get(i.id);
    const outstanding = Number(t?.outstanding ?? 0);
    return {
      id: i.id,
      number: i.number,
      status: i.status,
      issueDate: i.issue_date,
      dueDate: i.due_date,
      currency: i.currency ?? "USD",
      subtotal: Number(t?.subtotal ?? 0),
      tax: Number(t?.tax ?? 0),
      discount: Number(t?.discount ?? 0),
      total: Number(t?.total ?? 0),
      paid: Number(t?.paid ?? 0),
      outstanding,
      isOverdue: outstanding > 0 && Boolean(i.due_date) && i.due_date! < today,
    };
  });
}

/** Every figure summed from the invoices above, so the two cannot disagree. */
export async function getBillingSummary(): Promise<BillingSummary> {
  const invoices = await listClientInvoices();

  const open = invoices.filter((i) => i.outstanding > 0);
  const upcoming = open
    .filter((i) => i.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0];

  return {
    outstanding: open.reduce((sum, i) => sum + i.outstanding, 0),
    paidToDate: invoices.reduce((sum, i) => sum + i.paid, 0),
    overdueCount: invoices.filter((i) => i.isOverdue).length,
    nextDue: upcoming
      ? { number: upcoming.number, dueDate: upcoming.dueDate!, total: upcoming.total }
      : null,
  };
}
