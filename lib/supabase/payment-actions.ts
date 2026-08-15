"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Client-initiated payments.
 *
 * `PaymentPanel` used to fake the whole thing: the pay button ran a
 * `setTimeout`, swapped the badge to "Paid", and wrote nothing. The comment in
 * that file said so.
 *
 * What is real now is everything on this side of the processor boundary. A
 * client pressing Pay creates a `payment_intents` row in `requires_payment`.
 * A processor session would be opened against that row, and its webhook would
 * call `settlePaymentIntent`, which posts to `invoice_payments` and flips the
 * invoice to paid **in a single database function** — so a crash between
 * charging the card and recording the money cannot happen.
 *
 * `provider` stays 'unconfigured' until a key exists. That is deliberately
 * visible in the data rather than hidden: an intent that nothing can settle
 * should be obvious in the admin, not indistinguishable from a real one.
 */

export type PaymentIntentRow = Database["public"]["Tables"]["payment_intents"]["Row"];
export type PaymentState = Database["public"]["Enums"]["payment_state"];

type Result<T = void> = T extends void
  ? { ok: true } | { error: string }
  : { ok: true; data: T } | { error: string };

export const paymentProviderConfigured = async (): Promise<boolean> =>
  Boolean(process.env.PAYMENT_PROVIDER_KEY);

/**
 * Opens a payment attempt against an invoice.
 *
 * The amount is read from `invoice_totals`, never from the form. A client-side
 * amount is a client-controlled amount, and trusting it would let somebody
 * settle a $12,000 invoice by posting $1.
 */
export async function createPaymentIntent(
  invoiceId: string
): Promise<Result<{ id: string; configured: boolean }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: totals } = await supabase
    .from("invoice_totals")
    .select("outstanding")
    .eq("invoice_id", invoiceId)
    .maybeSingle();

  const outstanding = Number(totals?.outstanding ?? 0);
  if (!(outstanding > 0)) {
    return { error: "There is nothing outstanding on this invoice." };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("currency, number")
    .eq("id", invoiceId)
    .maybeSingle();

  // Keyed on the invoice, the payer and the amount. Double-clicking Pay, or
  // retrying after a dropped response, reuses the same intent instead of
  // opening a second charge.
  const idempotencyKey = `inv:${invoiceId}:${user.id}:${outstanding.toFixed(2)}`;

  const { data: existing } = await supabase
    .from("payment_intents")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      data: { id: existing.id, configured: Boolean(process.env.PAYMENT_PROVIDER_KEY) },
    };
  }

  const { data, error } = await supabase
    .from("payment_intents")
    .insert({
      invoice_id: invoiceId,
      amount: outstanding,
      currency: invoice?.currency ?? "USD",
      state: "requires_payment",
      provider: process.env.PAYMENT_PROVIDER_KEY ? "card" : "unconfigured",
      idempotency_key: idempotencyKey,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message.toLowerCase().includes("row-level security")
        ? "You do not have permission to pay this invoice."
        : (error?.message ?? "Could not start the payment."),
    };
  }

  revalidatePath(`/client/invoices/${invoiceId}`);
  return {
    ok: true,
    data: { id: data.id, configured: Boolean(process.env.PAYMENT_PROVIDER_KEY) },
  };
}

export async function listPaymentIntents(invoiceId: string): Promise<PaymentIntentRow[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PaymentIntentRow[];
}

/**
 * Marks an intent paid and posts it to the ledger.
 *
 * Admin-only, enforced inside the database function. This is what a processor
 * webhook would call once the charge clears; until a processor exists it is
 * also how an admin records a bank transfer against an intent a client opened.
 */
export async function settlePaymentIntent(
  intentId: string,
  providerRef?: string
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("settle_payment_intent", {
    p_intent: intentId,
    p_provider_ref: providerRef ?? undefined,
  });

  if (error) {
    return {
      error: error.message.includes("administrator")
        ? "Only an administrator can settle a payment."
        : error.message,
    };
  }

  revalidatePath("/client/invoices");
  revalidatePath("/admin/invoices");
  return { ok: true };
}

/**
 * A client telling us they have paid.
 *
 * Delegates to the `declare_payment` RPC, which reads the amount from
 * `invoice_totals` rather than trusting anything the browser sends and creates
 * the intent in `requires_payment`. It deliberately does NOT settle: an admin
 * confirms against the bank and calls `settlePaymentIntent`, which is the only
 * path that writes to the ledger.
 */
export async function declarePayment(
  invoiceId: string,
  reference?: string
): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("declare_payment", {
    p_invoice: invoiceId,
    p_reference: reference?.trim() || undefined,
  });

  if (error) {
    return {
      error: error.message.includes("nothing outstanding")
        ? "There is nothing outstanding on this invoice."
        : error.message.includes("not authorised")
          ? "You do not have access to this invoice."
          : error.message,
    };
  }

  revalidatePath(`/client/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  return { ok: true, data: { id: data as string } };
}

/** Declarations awaiting an admin's confirmation. */
export async function listDeclaredPayments(): Promise<PaymentIntentRow[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("provider", "manual")
    .in("state", ["requires_payment", "processing"])
    .order("created_at", { ascending: false });
  return (data ?? []) as PaymentIntentRow[];
}

/** The caller's own declaration on one invoice, if they have made one. */
export async function getMyDeclaration(invoiceId: string): Promise<PaymentIntentRow | null> {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("invoice_id", invoiceId)
    .eq("created_by", user.id)
    .neq("state", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PaymentIntentRow | null) ?? null;
}

export async function failPaymentIntent(intentId: string, reason: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_intents")
    .update({ state: "failed", failure_reason: reason.slice(0, 500) })
    .eq("id", intentId);
  if (error) return { error: error.message };

  revalidatePath("/client/invoices");
  revalidatePath("/admin/invoices");
  return { ok: true };
}
