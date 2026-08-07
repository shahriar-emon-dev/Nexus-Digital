import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getInvoice } from "@/lib/supabase/invoice-actions";
import { money } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PrintButton } from "./PaymentPanel";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const invoice = await getInvoice(params.id);
  return { title: invoice ? invoice.number : "Invoice not found" };
}

/**
 * A single invoice, read from Postgres.
 *
 * RLS decides visibility, so a client requesting somebody else's invoice id
 * gets null here and a 404 — the same answer as an id that does not exist,
 * which is what stops this being an enumeration oracle.
 */
export default async function InvoiceDetailPage({ params }: Params) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

  const t = invoice.totals;

  return (
    <>
      <DashboardHeader
        title={invoice.number}
        titleAs="p"
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Invoices", href: "/client/invoices" },
          { label: invoice.number },
        ]}
        actions={<PrintButton />}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-10 lg:px-10">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href="/client/invoices" />}
        >
          <ArrowLeft />
          All invoices
        </Button>

        <Card variant="glass" className="gap-6 rounded-2xl p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-[2rem] leading-none font-bold text-ink">
                {invoice.number}
              </h1>
              <p className="mt-2 text-ink-tertiary">
                Issued {invoice.issue_date ?? "—"} · Due {invoice.due_date ?? "—"}
              </p>
            </div>
            <Badge
              variant={
                t.outstanding === 0 ? "success" : invoice.status === "overdue" ? "danger" : "warning"
              }
            >
              {invoice.status}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-[0.875rem]">
              <thead>
                <tr className="border-b border-line text-left text-[0.6875rem] tracking-wide text-ink-tertiary uppercase">
                  <th className="py-2 pr-3 font-semibold">Description</th>
                  <th className="py-2 pr-3 text-right font-semibold">Qty</th>
                  <th className="py-2 pr-3 text-right font-semibold">Unit</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((line) => (
                  <tr key={line.id} className="border-b border-line-subtle last:border-0">
                    <td className="py-2.5 pr-3 text-ink">{line.description}</td>
                    <td data-tabular className="py-2.5 pr-3 text-right text-ink-tertiary">
                      {line.quantity}
                    </td>
                    <td data-tabular className="py-2.5 pr-3 text-right text-ink-tertiary">
                      {money.format(Number(line.unit_price))}
                    </td>
                    <td data-tabular className="py-2.5 text-right font-medium text-ink">
                      {money.format(Number(line.quantity) * Number(line.unit_price))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto flex w-full max-w-xs flex-col gap-2 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-ink-tertiary">Subtotal</dt>
              <dd data-tabular className="text-ink">{money.format(t.subtotal)}</dd>
            </div>
            {t.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-tertiary">Discount</dt>
                <dd data-tabular className="text-ink">−{money.format(t.discount)}</dd>
              </div>
            )}
            {t.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-tertiary">Tax</dt>
                <dd data-tabular className="text-ink">{money.format(t.tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="font-semibold text-ink">Total</dt>
              <dd data-tabular className="font-semibold text-ink">{money.format(t.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-tertiary">Paid</dt>
              <dd data-tabular className="text-ink">{money.format(t.paid)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-semibold text-ink">Outstanding</dt>
              <dd data-tabular className="font-semibold text-brand">
                {money.format(t.outstanding)}
              </dd>
            </div>
          </dl>

          {invoice.notes && (
            <p className="rounded-xl bg-surface-sunken p-4 text-[0.875rem] whitespace-pre-wrap text-ink-secondary">
              {invoice.notes}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
