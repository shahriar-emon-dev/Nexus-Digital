import type { Metadata } from "next";

import { money } from "@/lib/format";
import { listClientInvoices } from "@/lib/supabase/client-billing";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Tax Reports" };

/**
 * Was a placeholder.
 *
 * Tax is summed per calendar year from `invoice_totals`, which derives it from
 * each invoice's own rate. Nothing here is a filing or advice — it is a total
 * of what was charged, which is the only claim this data supports, and the note
 * at the bottom says so rather than leaving the reader to assume otherwise.
 */
export default async function ClientTaxReportsPage() {
  const invoices = await listClientInvoices();

  const byYear = new Map<string, { net: number; tax: number; gross: number; count: number }>();
  for (const invoice of invoices) {
    if (!invoice.issueDate) continue;
    const year = invoice.issueDate.slice(0, 4);
    const row = byYear.get(year) ?? { net: 0, tax: 0, gross: 0, count: 0 };
    row.net += invoice.subtotal - invoice.discount;
    row.tax += invoice.tax;
    row.gross += invoice.total;
    row.count += 1;
    byYear.set(year, row);
  }
  const years = [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <>
      <DashboardHeader
        title="Tax Reports"
        description="Tax charged on your invoices, by calendar year."
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Invoices", href: "/client/invoices" },
          { label: "Tax Reports" },
        ]}
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6 lg:px-8">
        {years.length === 0 ? (
          <Card variant="glass" className="items-center gap-2 rounded-2xl p-12 text-center">
            <p className="text-ink-tertiary">No invoices have been issued yet.</p>
          </Card>
        ) : (
          years.map(([year, row]) => (
            <Card key={year} variant="glass" className="gap-4 rounded-2xl p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-heading text-xl font-semibold text-ink">{year}</h2>
                <p className="text-[0.8125rem] text-ink-tertiary">
                  <span data-tabular>{row.count}</span>{" "}
                  {row.count === 1 ? "invoice" : "invoices"}
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                    Net
                  </dt>
                  <dd data-tabular className="mt-1 font-medium text-ink">
                    {money.format(row.net)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                    Tax
                  </dt>
                  <dd data-tabular className="mt-1 font-medium text-ink">
                    {money.format(row.tax)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                    Gross
                  </dt>
                  <dd data-tabular className="mt-1 font-medium text-ink">
                    {money.format(row.gross)}
                  </dd>
                </div>
              </dl>
            </Card>
          ))
        )}

        <p className="text-[0.8125rem] text-ink-tertiary">
          A summary of tax charged, not a filing or tax advice. Check these figures with your
          accountant before using them in a return.
        </p>
      </div>
    </>
  );
}
