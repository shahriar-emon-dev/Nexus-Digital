"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/use-realtime";
import { money } from "@/lib/format";
import type { ClientInvoice } from "@/lib/supabase/client-billing";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/**
 * The client's invoice list.
 *
 * Read from `invoices` and `invoice_totals`. The version this replaces filtered
 * a hardcoded array of eleven invented invoices, so the tab counts, the totals
 * and the overdue badge all described a ledger that did not exist.
 *
 * "Overdue" is derived here from the due date and the outstanding balance
 * rather than being a stored status — a stored one goes stale the moment a date
 * passes without something running.
 */
export function InvoicesTable({ invoices }: { invoices: ClientInvoice[] }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<string>("All");

  useRealtime(
    "client:invoices",
    [{ table: "invoices" }, { table: "invoice_payments" }],
    () => router.refresh()
  );

  const tabs = React.useMemo(() => {
    const set = new Set<string>(["All"]);
    if (invoices.some((i) => i.isOverdue)) set.add("Overdue");
    if (invoices.some((i) => i.outstanding > 0 && !i.isOverdue)) set.add("Outstanding");
    if (invoices.some((i) => i.outstanding === 0)) set.add("Paid");
    return [...set];
  }, [invoices]);

  const shown = React.useMemo(() => {
    if (tab === "Overdue") return invoices.filter((i) => i.isOverdue);
    if (tab === "Outstanding") return invoices.filter((i) => i.outstanding > 0 && !i.isOverdue);
    if (tab === "Paid") return invoices.filter((i) => i.outstanding === 0);
    return invoices;
  }, [invoices, tab]);

  if (invoices.length === 0) {
    return (
      <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
        <Receipt className="size-8 text-ink-tertiary" aria-hidden />
        <h2 className="font-heading text-xl font-semibold text-ink">No invoices yet</h2>
        <p className="max-w-sm text-ink-tertiary">
          Invoices appear here as soon as they are issued. You will also be emailed a copy.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tabs.length > 1 && (
        <div role="group" aria-label="Filter invoices" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[0.8125rem] font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                tab === t
                  ? "bg-brand text-brand-fg"
                  : "border border-line bg-surface-sunken text-ink-tertiary hover:text-ink"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <Card variant="glass" className="overflow-x-auto rounded-2xl p-0">
        <table className="w-full min-w-[38rem] text-[0.875rem]">
          <thead>
            <tr className="border-b border-line text-left text-[0.6875rem] tracking-wide text-ink-tertiary uppercase">
              <th className="px-5 py-3 font-semibold">Invoice</th>
              <th className="px-5 py-3 font-semibold">Issued</th>
              <th className="px-5 py-3 font-semibold">Due</th>
              <th className="px-5 py-3 text-right font-semibold">Total</th>
              <th className="px-5 py-3 text-right font-semibold">Outstanding</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((invoice) => (
              <tr key={invoice.id} className="border-b border-line-subtle last:border-0">
                <td className="px-5 py-3">
                  <Link
                    href={`/client/invoices/${invoice.id}`}
                    className="rounded-sm font-medium text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none"
                  >
                    {invoice.number}
                  </Link>
                </td>
                <td data-tabular className="px-5 py-3 whitespace-nowrap text-ink-tertiary">
                  {invoice.issueDate ?? "—"}
                </td>
                <td data-tabular className="px-5 py-3 whitespace-nowrap text-ink-tertiary">
                  {invoice.dueDate ?? "—"}
                </td>
                <td data-tabular className="px-5 py-3 text-right text-ink">
                  {money.format(invoice.total)}
                </td>
                <td data-tabular className="px-5 py-3 text-right font-medium text-ink">
                  {money.format(invoice.outstanding)}
                </td>
                <td className="px-5 py-3">
                  <Badge
                    variant={
                      invoice.isOverdue
                        ? "danger"
                        : invoice.outstanding === 0
                          ? "success"
                          : "warning"
                    }
                    size="sm"
                  >
                    {invoice.isOverdue
                      ? "Overdue"
                      : invoice.outstanding === 0
                        ? "Paid"
                        : invoice.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
