import type { Metadata } from "next";

import { money } from "@/lib/format";
import { getBillingSummary, listClientInvoices } from "@/lib/supabase/client-billing";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Billing Insights" };

/**
 * Was a placeholder.
 *
 * Every figure is summed from the caller's own invoices. There is deliberately
 * no forecast or trend line: a handful of invoices is not a trend, and a
 * projection drawn from that would look like analysis while being noise.
 */
export default async function ClientBillingInsightsPage() {
  const [invoices, summary] = await Promise.all([listClientInvoices(), getBillingSummary()]);

  const byMonth = new Map<string, number>();
  for (const invoice of invoices) {
    if (!invoice.issueDate) continue;
    const key = invoice.issueDate.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + invoice.total);
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  // Guarded against zero so an all-zero history cannot divide by nothing.
  const peak = Math.max(1, ...months.map(([, value]) => value));

  const settled = invoices.filter((invoice) => invoice.outstanding === 0).length;

  return (
    <>
      <DashboardHeader
        title="Billing Insights"
        description="Your invoicing history, summed from the invoices themselves."
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Invoices", href: "/client/invoices" },
          { label: "Insights" },
        ]}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 lg:px-8">
        {invoices.length === 0 ? (
          <Card variant="glass" className="items-center gap-2 rounded-2xl p-12 text-center">
            <p className="text-ink-tertiary">
              Nothing to analyse yet — no invoices have been issued.
            </p>
          </Card>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Invoices", value: String(invoices.length) },
                { label: "Settled", value: `${settled}/${invoices.length}` },
                { label: "Billed", value: money.format(summary.outstanding + summary.paidToDate) },
                { label: "Outstanding", value: money.format(summary.outstanding) },
              ].map((card) => (
                <Card key={card.label} variant="glass" className="rounded-2xl p-5">
                  <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                    {card.label}
                  </dt>
                  <dd
                    data-tabular
                    className="mt-1 font-heading text-[1.5rem] leading-none font-bold text-ink"
                  >
                    {card.value}
                  </dd>
                </Card>
              ))}
            </dl>

            {months.length > 0 && (
              <Card variant="glass" className="gap-4 rounded-2xl p-6">
                <h2 className="font-heading text-xl font-semibold text-ink">Billed by month</h2>
                <dl className="flex flex-col gap-3">
                  {months.map(([month, value]) => (
                    <div key={month} className="flex flex-wrap items-baseline gap-x-3">
                      <dt className="w-20 text-[0.8125rem] text-ink-tertiary">{month}</dt>
                      <dd data-tabular className="text-[0.875rem] font-medium text-ink">
                        {money.format(value)}
                      </dd>
                      {/* Decorative — the figure beside it carries the value. */}
                      <div
                        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line"
                        aria-hidden
                      >
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${Math.round((value / peak) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </dl>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
