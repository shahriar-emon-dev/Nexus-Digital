"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  CreditCard,
  Headset,
  Landmark,
  Lock,
  Printer,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { money } from "@/lib/invoices";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, InputGroup } from "@/components/ui/input";

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
 * Payment panel.
 *
 * The source faked the whole thing: the pay button ran a `setTimeout`, swapped
 * itself to "Payment Successful", then quietly reverted three seconds later.
 * Nothing was charged and nothing was recorded. Here the form is real but the
 * submit says plainly that no processor is connected, because a client seeing a
 * green "paid" state on an invoice that is still outstanding is the worst
 * possible outcome on this screen.
 */
export function PaymentPanel({
  invoiceId,
  amount,
  paid,
}: {
  invoiceId: string;
  amount: number;
  paid: boolean;
}) {
  const [notice, setNotice] = React.useState(false);
  const [altOpen, setAltOpen] = React.useState(false);

  if (paid) {
    return (
      <Card variant="glass" className="gap-4 rounded-3xl p-8">
        <h2 className="font-heading text-xl font-semibold text-ink">Payment received</h2>
        <p className="text-ink-secondary">
          {invoiceId} was settled in full. Nothing further is due on this invoice.
        </p>
        <Button variant="outline" render={<Link href="/client/invoices" />}>
          Back to all invoices
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="beam-rotate gap-6 rounded-3xl p-8">
      <h2 className="font-heading text-xl font-semibold text-ink">Process payment</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setNotice(true);
        }}
        className="flex flex-col gap-5"
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
            Credit or debit card
          </legend>

          <InputGroup
            name="card"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="Card number"
            aria-label="Card number"
            leading={<CreditCard />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="expiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM / YY"
              aria-label="Card expiry date"
            />
            <Input
              name="cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVC"
              aria-label="Card security code"
            />
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => setNotice(true)}>
            <Wallet />
            Wallet
          </Button>
          <Button type="button" variant="outline" onClick={() => setNotice(true)}>
            <Landmark />
            ACH
          </Button>
        </div>

        <Button
          type="submit"
          size="xl"
          className="w-full rounded-xl shadow-[0_0_30px_var(--brand-glow)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Pay {money.format(amount)} now
        </Button>

        <p className="flex items-center justify-center gap-2 text-[0.75rem] text-ink-tertiary">
          <Lock className="size-3.5" aria-hidden />
          Card details are never stored by Nexus
        </p>

        {notice && (
          <Alert tone="warning">
            <AlertTitle>No payment was taken</AlertTitle>
            <AlertDescription>
              {/* TODO: replace with the real processor session once billing is wired. */}
              A payment processor is not connected yet, so {invoiceId} is still
              outstanding. Nothing has been charged.
            </AlertDescription>
          </Alert>
        )}
      </form>

      {/* ── Alternative payment ────────────────────────────────────────── */}
      <div className="border-t border-line-subtle pt-6">
        <button
          type="button"
          onClick={() => setAltOpen((v) => !v)}
          aria-expanded={altOpen}
          aria-controls="alt-payment"
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-lg text-left font-semibold text-ink",
            "transition-colors hover:text-brand",
            "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          )}
        >
          Bank transfer
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 transition-transform duration-(--duration-normal) ease-(--ease-out-quint)",
              altOpen && "rotate-180"
            )}
          />
        </button>

        {altOpen && (
          <div id="alt-payment" className="mt-4 flex flex-col gap-4">
            <dl className="flex flex-col gap-2 rounded-xl bg-surface-sunken p-4 text-[0.8125rem]">
              <p className="mb-1 flex items-center gap-2 text-[0.6875rem] font-semibold tracking-widest text-brand uppercase">
                <Building2 className="size-3.5" aria-hidden />
                Transfer details
              </p>
              {[
                ["Bank", "Digital Federal Trust"],
                ["SWIFT", "DFTBUS33XXX"],
                ["Account", "•••• •••• 8842"],
                ["Reference", invoiceId],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-ink-tertiary">{label}</dt>
                  <dd data-tabular className="text-right font-medium text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="txn-id"
                className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
              >
                Transaction reference
              </label>
              <div className="flex gap-2">
                <Input
                  id="txn-id"
                  placeholder="TXN-000000"
                  className="flex-1"
                  onChange={() => setNotice(false)}
                />
                <Button variant="outline" onClick={() => setNotice(true)}>
                  Submit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/client/messages"
        className={cn(
          "flex items-center gap-4 rounded-2xl border border-line bg-surface-sunken p-4",
          "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
          "hover:-translate-y-0.5 hover:border-brand-line",
          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        )}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ion-subtle text-ion">
          <Headset className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block font-semibold text-ink">Need assistance?</span>
          <span className="block text-[0.8125rem] text-ink-tertiary">
            Talk to our billing team
          </span>
        </span>
      </Link>
    </Card>
  );
}
