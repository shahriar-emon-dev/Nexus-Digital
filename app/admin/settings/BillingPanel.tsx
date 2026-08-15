"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Landmark, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  updatePaymentSettings,
  type SiteSettings,
} from "@/lib/supabase/site-settings-actions";

/**
 * How clients are told to pay.
 *
 * Until now these details were three hardcoded lines inside a credit-card form
 * that was never rendered — a bank, a SWIFT code and an account number for an
 * institution unrelated to this agency. Whatever is typed here is what a client
 * sees on any unpaid invoice.
 *
 * Deliberately a plain textarea rather than a set of fixed fields. Payment
 * details differ by country and by bank — IBAN and BIC in Europe, routing and
 * account in the US, bKash or Nagad locally — and a rigid schema would force
 * somebody to squeeze the wrong shape into the wrong labels.
 */
export function BillingPanel({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await updatePaymentSettings(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({ title: "Payment details saved", type: "success" });
      router.refresh();
    });
  }

  return (
    <Card variant="glass" className="gap-5 rounded-2xl p-6">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <Landmark className="size-5 text-brand" aria-hidden />
          Payment details
        </h2>
        <p className="mt-1 max-w-prose text-sm text-ink-tertiary">
          Shown to a client on any invoice that still has a balance. Payments are
          recorded by hand — a client can flag that they have paid, and finance
          confirms it against the bank before anything reaches the ledger.
        </p>
      </div>

      {error && (
        <Alert tone="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pay-instructions" className="text-[0.8125rem] font-medium text-ink">
            Transfer details
          </label>
          <textarea
            id="pay-instructions"
            name="paymentInstructions"
            rows={7}
            defaultValue={settings.payment_instructions ?? ""}
            placeholder={"Bank: …\nAccount name: …\nAccount number / IBAN: …\nSWIFT / BIC: …\n\nbKash: …\nNagad: …"}
            className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-[0.875rem] leading-relaxed text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          />
          <p className="text-xs text-ink-tertiary">
            Rendered as plain text on the invoice, never as HTML — line breaks
            are preserved and markup is not executed.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pay-ref" className="text-[0.8125rem] font-medium text-ink">
            What should they quote?
          </label>
          <Input
            id="pay-ref"
            name="paymentReferenceHint"
            defaultValue={settings.payment_reference_hint ?? ""}
            placeholder="the invoice number"
            maxLength={160}
          />
          <p className="text-xs text-ink-tertiary">
            Defaults to the invoice number when left blank.
          </p>
        </div>

        <Button type="submit" disabled={pending} className="w-fit">
          {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
          Save payment details
        </Button>
      </form>
    </Card>
  );
}
