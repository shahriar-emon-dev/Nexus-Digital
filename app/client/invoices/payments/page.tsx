import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Payments" };

/** Was a placeholder. Payments recorded against your invoices. */
export default async function ClientPaymentsPage() {
  const supabase = await createClient();

  // RLS scopes payments through their invoice, so there is no filter here.
  const { data } = await supabase
    .from("invoice_payments")
    .select("id, amount, paid_on, method, reference, invoice:invoices ( number )")
    .order("paid_on", { ascending: false });

  const payments = (data ?? []) as unknown as {
    id: string;
    amount: number;
    paid_on: string;
    method: string | null;
    reference: string | null;
    invoice: { number: string } | null;
  }[];

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      <DashboardHeader
        title="Payments"
        description="Everything received against your invoices."
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Invoices", href: "/client/invoices" },
          { label: "Payments" },
        ]}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 lg:px-8">
        {payments.length === 0 ? (
          <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
            <Receipt className="size-8 text-ink-tertiary" aria-hidden />
            <h2 className="font-heading text-xl font-semibold text-ink">No payments recorded</h2>
            <p className="max-w-sm text-ink-tertiary">
              Payments appear here once they have been received and reconciled.
            </p>
          </Card>
        ) : (
          <>
            <Card variant="glass" className="rounded-2xl p-6">
              <p className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                Total received
              </p>
              <p
                data-tabular
                className="mt-1 font-heading text-[2rem] leading-none font-bold text-ink"
              >
                {money.format(total)}
              </p>
            </Card>

            <Card variant="glass" className="overflow-x-auto rounded-2xl p-0">
              <table className="w-full min-w-[32rem] text-[0.875rem]">
                <thead>
                  <tr className="border-b border-line text-left text-[0.6875rem] tracking-wide text-ink-tertiary uppercase">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Invoice</th>
                    <th className="px-5 py-3 font-semibold">Method</th>
                    <th className="px-5 py-3 font-semibold">Reference</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-line-subtle last:border-0">
                      <td data-tabular className="px-5 py-3 whitespace-nowrap text-ink-tertiary">
                        {p.paid_on}
                      </td>
                      <td className="px-5 py-3 text-ink">{p.invoice?.number ?? "—"}</td>
                      <td className="px-5 py-3 text-ink-tertiary">{p.method ?? "—"}</td>
                      <td className="px-5 py-3 text-ink-tertiary">{p.reference ?? "—"}</td>
                      <td data-tabular className="px-5 py-3 text-right font-medium text-ink">
                        {money.format(Number(p.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
