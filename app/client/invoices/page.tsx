import type { Metadata } from "next";
import { CalendarClock, TrendingUp, Wallet } from "lucide-react";

import { billingSummary, invoiceTotal, money } from "@/lib/invoices";
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

export default function ClientInvoicesPage() {
  const next = billingSummary.nextDue;
  const days = next ? daysUntil(next.dueOn) : 0;
  const billed = billingSummary.outstanding + billingSummary.paidToDate;
  const outstandingPct = billed === 0 ? 0 : Math.round((billingSummary.outstanding / billed) * 100);

  return (
    <>
      <DashboardHeader
        title="Invoices"
        titleAs="p"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Invoices" }]}
      />

      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Billing
          </h1>
          <p className="mt-2 text-lg text-ink-tertiary">
            Every invoice raised against your account, and what is still open.
          </p>
        </div>

        {/* ── Summary bento ─────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card
            variant="glass"
            lift
            className="group relative gap-0 overflow-hidden rounded-2xl p-6"
          >
            <Wallet
              className="pointer-events-none absolute -top-3 -right-3 size-24 text-brand opacity-[0.07] transition-opacity duration-(--duration-slow) group-hover:opacity-20"
              aria-hidden
            />
            <p className="text-[0.8125rem] font-semibold tracking-wider text-ink-tertiary uppercase">
              Total paid to date
            </p>
            <p
              data-tabular
              className="mt-2 font-heading text-[2.5rem] leading-none font-bold text-brand"
            >
              {money.format(billingSummary.paidToDate)}
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-[0.8125rem] text-success">
              <TrendingUp className="size-4" aria-hidden />
              <span data-tabular>{billingSummary.paidCount}</span> invoices settled
            </p>
          </Card>

          <Card variant="glass" lift className="border-beam gap-0 rounded-2xl p-6">
            <p className="text-[0.8125rem] font-semibold tracking-wider text-ink-tertiary uppercase">
              Current outstanding balance
            </p>
            <p
              data-tabular
              className="mt-2 font-heading text-[2.5rem] leading-none font-bold text-ink"
            >
              {money.format(billingSummary.outstanding)}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-label="Share of billing still outstanding"
                aria-valuenow={outstandingPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-ion shadow-[0_0_20px_var(--brand-glow)]"
                  style={{ width: `${outstandingPct}%` }}
                />
              </div>
              <span className="shrink-0 text-[0.75rem] whitespace-nowrap text-ink-tertiary">
                <span data-tabular>{billingSummary.pendingCount}</span> pending
              </span>
            </div>
          </Card>

          <Card
            variant="glass"
            lift
            className="group relative gap-0 overflow-hidden rounded-2xl p-6"
          >
            <CalendarClock
              className="pointer-events-none absolute -top-3 -right-3 size-24 text-chart-3 opacity-[0.07] transition-opacity duration-(--duration-slow) group-hover:opacity-20"
              aria-hidden
            />
            <p className="text-[0.8125rem] font-semibold tracking-wider text-ink-tertiary uppercase">
              Next payment due
            </p>
            <p
              data-tabular
              className="mt-2 font-heading text-[2rem] leading-tight font-bold text-chart-3"
            >
              {next ? longDate.format(new Date(next.dueOn)) : "Nothing due"}
            </p>
            {next && (
              <p className="mt-4 text-[0.8125rem] text-ink-tertiary">
                {days < 0 ? (
                  <span className="text-danger">
                    {next.id} is <span data-tabular>{Math.abs(days)}</span> days overdue
                  </span>
                ) : (
                  <>
                    {next.id} · <span data-tabular>{money.format(invoiceTotal(next))}</span>{" "}
                    in <span data-tabular>{days}</span> days
                  </>
                )}
              </p>
            )}
          </Card>
        </section>

        <InvoicesTable />
      </div>
    </>
  );
}
