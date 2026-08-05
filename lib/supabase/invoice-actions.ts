"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Invoices, line items and payments.
 *
 * No money is stored on the invoice. Subtotal, discount, tax, total, paid and
 * outstanding are all derived by the invoice_totals view, because the module
 * this replaces stored a tax amount reverse-engineered to hit a round total —
 * 177.50 where the arithmetic gives 203.63. Nothing here writes a figure the
 * line items do not produce.
 */

export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
export type LineItem = Database["public"]["Tables"]["invoice_line_items"]["Row"];
export type Payment = Database["public"]["Tables"]["invoice_payments"]["Row"];

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  outstanding: number;
};

export type AdminInvoice = InvoiceRow & {
  organizations: { id: string; name: string } | null;
  totals: InvoiceTotals;
  /** Past its due date and not settled. Derived from the clock, never stored. */
  isOverdue: boolean;
};

export type InvoiceDetail = AdminInvoice & {
  lineItems: LineItem[];
  payments: Payment[];
};

const ZERO: InvoiceTotals = {
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  paid: 0,
  outstanding: 0,
};

function totalsFrom(row: Record<string, unknown> | undefined): InvoiceTotals {
  if (!row) return ZERO;
  return {
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    paid: Number(row.paid ?? 0),
    outstanding: Number(row.outstanding ?? 0),
  };
}

const overdue = (inv: InvoiceRow, t: InvoiceTotals) =>
  inv.status !== "paid" &&
  inv.status !== "void" &&
  inv.due_date !== null &&
  t.outstanding > 0 &&
  new Date(inv.due_date) < new Date();

export async function listInvoices(): Promise<AdminInvoice[]> {
  noStore(); // overdue is time-dependent, so a cached read would go stale
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select("*, organizations ( id, name )")
    .order("issue_date", { ascending: false });

  const rows = (data ?? []) as unknown as Array<
    InvoiceRow & { organizations: { id: string; name: string } | null }
  >;
  if (rows.length === 0) return [];

  // Separate query rather than an embed: invoice_totals is a view, and
  // PostgREST resolves embeds through foreign key metadata a view does not
  // have. Embedding it returned nothing at all and the pipeline read $0 with
  // real invoices open.
  const { data: totals } = await supabase
    .from("invoice_totals")
    .select("*")
    .in("invoice_id", rows.map((r) => r.id));

  const byId = new Map(
    (totals ?? []).map((t) => [t.invoice_id as string, totalsFrom(t as Record<string, unknown>)])
  );

  return rows.map((r) => {
    const t = byId.get(r.id) ?? ZERO;
    return { ...r, totals: t, isOverdue: overdue(r, t) };
  });
}

export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select("*, organizations ( id, name )")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const row = data as unknown as InvoiceRow & {
    organizations: { id: string; name: string } | null;
  };

  const [totalsRes, itemsRes, paymentsRes] = await Promise.all([
    supabase.from("invoice_totals").select("*").eq("invoice_id", id).maybeSingle(),
    supabase.from("invoice_line_items").select("*").eq("invoice_id", id).order("position"),
    supabase
      .from("invoice_payments")
      .select("*")
      .eq("invoice_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  const t = totalsFrom(totalsRes.data as Record<string, unknown> | undefined);
  return {
    ...row,
    totals: t,
    isOverdue: overdue(row, t),
    lineItems: (itemsRes.data ?? []) as LineItem[],
    payments: (paymentsRes.data ?? []) as Payment[],
  };
}

/* ------------------------------------------------------------ mutations -- */

type Result<T = void> = T extends void
  ? { ok: true } | { error: string }
  : { ok: true; data: T } | { error: string };

export type DraftLine = { description: string; quantity: number; unitPrice: number };

function parseLines(raw: string): DraftLine[] | null {
  try {
    const parsed = JSON.parse(raw) as DraftLine[];
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((l) => ({
        description: String(l.description ?? "").trim(),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      }))
      .filter((l) => l.description.length > 0);
  } catch {
    return null;
  }
}

async function nextNumber(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const { data } = await supabase
    .from("invoices")
    .select("number")
    .like("number", `${prefix}%`)
    .order("number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.number as string | undefined;
  const seq = last ? Number(last.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function createInvoice(form: FormData): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in." };

  const organizationId = String(form.get("organizationId") ?? "").trim();
  if (!organizationId) return { error: "Choose the client this invoice is for." };

  const lines = parseLines(String(form.get("lines") ?? "[]"));
  if (lines === null) return { error: "Could not read the line items." };
  if (lines.length === 0) return { error: "An invoice needs at least one line." };
  for (const l of lines) {
    if (!Number.isFinite(l.quantity) || l.quantity <= 0) {
      return { error: `Quantity on "${l.description}" must be greater than zero.` };
    }
    if (!Number.isFinite(l.unitPrice) || l.unitPrice < 0) {
      return { error: `Unit price on "${l.description}" cannot be negative.` };
    }
  }

  const discountPct = Number(form.get("discountPct") ?? 0);
  const taxPct = Number(form.get("taxPct") ?? 0);
  if (discountPct < 0 || discountPct > 100) return { error: "Discount must be between 0 and 100%." };
  if (taxPct < 0 || taxPct > 100) return { error: "Tax must be between 0 and 100%." };

  const issueDate = String(form.get("issueDate") ?? "").trim() || undefined;
  const dueDate = String(form.get("dueDate") ?? "").trim() || null;
  if (issueDate && dueDate && dueDate < issueDate) {
    return { error: "The due date cannot fall before the issue date." };
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      number: String(form.get("number") ?? "").trim() || (await nextNumber(supabase)),
      status: (String(form.get("status") ?? "draft") as InvoiceStatus) || "draft",
      issue_date: issueDate,
      due_date: dueDate,
      discount_pct: discountPct,
      tax_pct: taxPct,
      notes: String(form.get("notes") ?? "").trim() || null,
      created_by: auth.user.id,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505" ? "That invoice number is already in use." : error.message,
    };
  }

  const { error: lineError } = await supabase.from("invoice_line_items").insert(
    lines.map((l, i) => ({
      invoice_id: invoice.id as string,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      position: i,
    }))
  );

  if (lineError) {
    // An invoice with no lines totals zero, which would sit in the list
    // looking settled. Better to leave nothing behind than a false record.
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { error: `Line items: ${lineError.message}` };
  }

  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/client/invoices");
  return { ok: true, data: { id: invoice.id as string } };
}

export async function updateInvoice(id: string, form: FormData): Promise<Result> {
  const supabase = await createClient();

  const discountPct = Number(form.get("discountPct") ?? 0);
  const taxPct = Number(form.get("taxPct") ?? 0);
  if (discountPct < 0 || discountPct > 100) return { error: "Discount must be between 0 and 100%." };
  if (taxPct < 0 || taxPct > 100) return { error: "Tax must be between 0 and 100%." };

  const issueDate = String(form.get("issueDate") ?? "").trim();
  const dueDate = String(form.get("dueDate") ?? "").trim() || null;
  if (issueDate && dueDate && dueDate < issueDate) {
    return { error: "The due date cannot fall before the issue date." };
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      status: String(form.get("status") ?? "draft") as InvoiceStatus,
      issue_date: issueDate || undefined,
      due_date: dueDate,
      discount_pct: discountPct,
      tax_pct: taxPct,
      notes: String(form.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Lines are replaced wholesale when supplied. Diffing five rows costs more
  // than rewriting them and can leave an orphan the totals still count.
  const raw = form.get("lines");
  if (typeof raw === "string") {
    const lines = parseLines(raw);
    if (lines === null) return { error: "Could not read the line items." };
    if (lines.length === 0) return { error: "An invoice needs at least one line." };

    await supabase.from("invoice_line_items").delete().eq("invoice_id", id);
    const { error: lineError } = await supabase.from("invoice_line_items").insert(
      lines.map((l, i) => ({
        invoice_id: id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        position: i,
      }))
    );
    if (lineError) return { error: `Line items: ${lineError.message}` };
  }

  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/client/invoices");
  return { ok: true };
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/client/invoices");
  return { ok: true };
}

/**
 * Records a payment against an invoice.
 *
 * The status is advanced to `paid` only when the outstanding balance actually
 * reaches zero — read back from the view rather than assumed, so a partial
 * payment cannot mark an invoice settled.
 */
export async function recordPayment(invoiceId: string, form: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in." };

  const amount = Number(form.get("amount") ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount above zero." };

  const { error } = await supabase.from("invoice_payments").insert({
    invoice_id: invoiceId,
    amount,
    // `method` is NOT NULL in the schema with a default; an empty field means
    // "unspecified" rather than an attempt to clear it.
    method: String(form.get("method") ?? "").trim() || undefined,
    reference: String(form.get("reference") ?? "").trim() || null,
    paid_at: String(form.get("paidAt") ?? "").trim() || new Date().toISOString(),
    recorded_by: auth.user.id,
  });
  if (error) return { error: error.message };

  const { data: totals } = await supabase
    .from("invoice_totals")
    .select("outstanding")
    .eq("invoice_id", invoiceId)
    .maybeSingle();

  if (totals && Number(totals.outstanding) <= 0) {
    await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
  }

  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/client/invoices");
  return { ok: true };
}

export async function deletePayment(paymentId: string): Promise<Result> {
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("invoice_payments")
    .select("invoice_id")
    .eq("id", paymentId)
    .maybeSingle();

  const { error } = await supabase.from("invoice_payments").delete().eq("id", paymentId);
  if (error) return { error: error.message };

  // Removing a payment can un-settle an invoice, so the status has to follow
  // the balance back down rather than stay where the last write left it.
  if (payment?.invoice_id) {
    const { data: totals } = await supabase
      .from("invoice_totals")
      .select("outstanding")
      .eq("invoice_id", payment.invoice_id as string)
      .maybeSingle();

    if (totals && Number(totals.outstanding) > 0) {
      await supabase.from("invoices").update({ status: "sent" }).eq("id", payment.invoice_id);
    }
  }

  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/client/invoices");
  return { ok: true };
}

export async function deleteInvoice(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/client/invoices");
  return { ok: true };
}
