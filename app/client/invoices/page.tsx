import type { Metadata } from "next";
import { CalendarClock, TrendingUp, Wallet } from "lucide-react";

import { money } from "@/lib/format";
import { getBillingSummary, listClientInvoices } from "@/lib/supabase/client-billing";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { InvoicesTable } from "./InvoicesTable";

export const metadata: Metadata = { title: "Invoices" };

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

/** Whole days from today to `iso`, negative when already past. */
function daysUntil(iso: string) {
  const then = new Date(`${iso}T00:00:00Z`).getTime();
  const today = new Date();
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((then - start) / 86_400_000);
}

/**
 * Was backed by lib/invoices.ts — eleven invented invoices and a summary
 * constant, identical for every client.
 */
export default async function ClientInvoicesPage() {
  const [invoices, summary] = await Promise.all([listClientInvoices(), getBillingSummary()]);

  const days = summary.nextDue ? daysUntil(summary.nextDue.dueDate) : null;
  const billed = summary.outstanding + summary.paidToDate;
  const outstandingPct = billed === 0 ? 0 : Math.round((summary.outstanding / billed) * 100);

  return (
    <>
      <DashboardHeader
        title="Invoices"
        titleAs="p"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Invoices" }]}
      />

      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <div>
          <h1 className="font-heading text-[2rem] leading-tight font-bold tracking-tight text-ink">
            Billing
          </h1>
          <p className="mt-1 text-ink-tertiary">
            Every invoice raised against your account.
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="glass" className="rounded-2xl p-6">
            <dt className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
              <Wallet className="size-4" aria-hidden />
              Outstanding
            </dt>
            <dd
              data-tabular
              className="mt-2 font-heading text-[2rem] leading-none font-bold text-ink"
            >
              {money.format(summary.outstanding)}
            </dd>
            {billed > 0 && (
              <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
                <span data-tabular>{outstandingPct}%</span> of everything billed
              </p>
            )}
          </Card>

          <Card variant="glass" className="rounded-2xl p-6">
            <dt className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
              <TrendingUp className="size-4" aria-hidden />
              Paid to date
            </dt>
            <dd
              data-tabular
              className="mt-2 font-heading text-[2rem] leading-none font-bold text-ink"
            >
              {money.format(summary.paidToDate)}
            </dd>
          </Card>

          <Card variant="glass" className="rounded-2xl p-6">
            <dt className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
              <CalendarClock className="size-4" aria-hidden />
              Next due
            </dt>
            {summary.nextDue && days !== null ? (
              <>
                <dd
                  data-tabular
                  className="mt-2 font-heading text-[2rem] leading-none font-bold text-ink"
                >
                  {money.format(summary.nextDue.total)}
                </dd>
                <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
                  {summary.nextDue.number} ·{" "}
                  {days < 0
                    ? `${Math.abs(days)} days overdue`
                    : days === 0
                      ? "due today"
                      : `in ${days} days`}{" "}
                  ({longDate.format(new Date(`${summary.nextDue.dueDate}T00:00:00Z`))})
                </p>
              </>
            ) : (
              /* An honest empty state rather than a zero that reads as a balance. */
              <dd className="mt-2 text-ink-tertiary">Nothing outstanding.</dd>
            )}
          </Card>
        </dl>

        <InvoicesTable invoices={invoices} />
      </div>
    </>
  );
}
