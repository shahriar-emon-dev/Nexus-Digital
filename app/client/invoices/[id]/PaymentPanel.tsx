"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Loader2, Printer, Send } from "lucide-react";

import { money } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { declarePayment, type PaymentIntentRow } from "@/lib/supabase/payment-actions";

/** Needs `window.print()`, so it lives on the client side of the boundary. */
export function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
    >
      <Printer />
      Print invoice
    </Button>
  );
}

/**
 * How to pay, and telling us you have.
 *
 * What was here before was a credit-card form — number, expiry, CVC, Wallet and
 * ACH buttons — whose submit handler set a piece of local state that rendered
 * "No payment was taken". It also carried hardcoded bank details for "Digital
 * Federal Trust", an institution this agency has no relationship with. None of
 * it was ever visible: the invoice page imports only `PrintButton` from this
 * file, so the entire panel was unreachable code pretending to be a checkout.
 *
 * Payments are collected manually, so this does the two honest things: it shows
 * the transfer details an administrator has actually configured, and it lets a
 * client say they have paid. That declaration creates a payment intent in
 * `requires_payment` — never `succeeded`. A client asserting payment is a
 * claim, not a reconciliation. An admin confirms it against the bank and the
 * ledger is written there.
 */
export function PaymentPanel({
  invoiceId,
  invoiceNumber,
  outstanding,
  paid,
  instructions,
  referenceHint,
  declared,
}: {
  invoiceId: string;
  invoiceNumber: string;
  outstanding: number;
  paid: boolean;
  instructions: string | null;
  referenceHint: string | null;
  declared: PaymentIntentRow | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [reference, setReference] = React.useState(declared?.provider_ref ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (paid) {
    return (
      <Card variant="glass" className="gap-4 rounded-3xl p-8">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
          <CheckCircle2 className="size-5 text-success" aria-hidden />
          Payment received
        </h2>
        <p className="text-ink-secondary">
          Invoice {invoiceNumber} is settled in full. Nothing further is due.
        </p>
        <Button variant="outline" render={<Link href="/client/invoices" />}>
          Back to all invoices
        </Button>
      </Card>
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await declarePayment(invoiceId, reference);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({ title: "Thanks — we'll confirm shortly", type: "success" });
      router.refresh();
    });
  }

  return (
    <Card variant="glass" className="gap-6 rounded-3xl p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold text-ink">Pay this invoice</h2>
        <p data-tabular className="font-heading text-2xl font-bold text-ink">
          {money.format(outstanding)}
        </p>
      </div>

      {instructions ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface-sunken p-4">
          <p className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-widest text-brand uppercase">
            <Building2 className="size-3.5" aria-hidden />
            Transfer details
          </p>
          {/* Plain text, never HTML: this is admin-entered content and rendering
              it as markup would make the settings screen an injection point. */}
          <p className="text-[0.875rem] leading-relaxed whitespace-pre-wrap text-ink-secondary">
            {instructions}
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            Please quote{" "}
            <span className="font-medium text-ink">
              {referenceHint || `invoice ${invoiceNumber}`}
            </span>{" "}
            so we can match your payment.
          </p>
        </div>
      ) : (
        <Alert tone="info">
          <AlertTitle>Payment details are not published yet</AlertTitle>
          <AlertDescription>
            Contact your account manager for transfer details. An administrator
            can publish them under Settings so they appear here automatically.
          </AlertDescription>
        </Alert>
      )}

      {declared ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-sunken px-4 py-3">
          <span className="text-sm text-ink-secondary">
            You told us you paid this on{" "}
            <span data-tabular>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(declared.created_at))}
            </span>
            {declared.provider_ref ? ` · ref ${declared.provider_ref}` : ""}
          </span>
          <Badge variant="warning">Awaiting confirmation</Badge>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 border-t border-line-subtle pt-6">
          <p className="text-sm text-ink-secondary">
            Already sent the transfer? Let us know and we will reconcile it.
          </p>

          {error && (
            <p role="alert" className="text-[0.875rem] text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment-ref" className="text-[0.8125rem] font-medium text-ink">
              Your payment reference <span className="text-ink-tertiary">(optional)</span>
            </label>
            <Input
              id="payment-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Bank reference or transaction id"
              maxLength={120}
            />
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            <Send />
            I have paid this
          </Button>

          <p className="text-xs text-ink-tertiary">
            This does not mark the invoice paid — it flags it for our finance
            team to confirm against the bank.
          </p>
        </form>
      )}
    </Card>
  );
}
