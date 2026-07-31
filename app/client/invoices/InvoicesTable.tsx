"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  CloudCog,
  Download,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  invoices,
  invoiceStatuses,
  invoiceStatusTone,
  invoiceTotal,
  money,
  recurringInvoices,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/invoices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const icons: Record<Invoice["icon"], LucideIcon> = {
  web: Globe,
  ai: Bot,
  cloud: CloudCog,
  retainer: RefreshCw,
};

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

type Tab = "All Invoices" | InvoiceStatus | "Recurring Retainers";

const PER_PAGE = 4;

export function InvoicesTable() {
  const [tab, setTab] = React.useState<Tab>("All Invoices");
  const [page, setPage] = React.useState(0);

  const tabs: Tab[] = React.useMemo(() => {
    const list: Tab[] = ["All Invoices", ...invoiceStatuses];
    // Only offered when there is something behind it.
    if (recurringInvoices.length > 0) list.push("Recurring Retainers");
    return list;
  }, []);

  const shown = React.useMemo(() => {
    if (tab === "All Invoices") return invoices;
    if (tab === "Recurring Retainers") return recurringInvoices;
    return invoices.filter((i) => i.status === tab);
  }, [tab]);

  const pageCount = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  // A filter change can leave you past the end of the new result set.
  const current = Math.min(page, pageCount - 1);
  const rows = shown.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);
  const from = shown.length === 0 ? 0 : current * PER_PAGE + 1;
  const to = current * PER_PAGE + rows.length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Filter invoices"
          className="scrollbar-none flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface-sunken p-1"
        >
          {tabs.map((option) => {
            const selected = tab === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setTab(option);
                  setPage(0);
                }}
                className={cn(
                  "rounded-lg px-5 py-2 text-[0.8125rem] font-semibold whitespace-nowrap",
                  "transition-all duration-(--duration-normal) ease-(--ease-out-quint)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "bg-brand text-brand-fg shadow-[0_0_20px_var(--brand-glow)]"
                    : "text-ink-tertiary hover:bg-surface hover:text-ink"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {/* TODO: wire to the invoices API once it exists. */}
          <Button variant="outline" size="sm">
            <SlidersHorizontal />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download />
            Export
          </Button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card variant="glass" className="overflow-hidden rounded-2xl">
        <div className="scrollbar-none overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Invoices, filtered by {tab}. Showing {from} to {to} of {shown.length}.
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken/60">
                {[
                  "Invoice ID",
                  "Project / service",
                  "Issued",
                  "Due",
                  "Amount",
                  "Status",
                  "Action",
                ].map((head, i) => (
                  <th
                    key={head}
                    scope="col"
                    className={cn(
                      "px-6 py-4 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase",
                      i === 5 && "text-center",
                      i === 6 && "text-right"
                    )}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-line-subtle">
              {rows.map((invoice) => {
                const Icon = icons[invoice.icon];
                const overdue = invoice.status === "Overdue";
                return (
                  <tr
                    key={invoice.id}
                    className="group transition-colors duration-(--duration-fast) hover:bg-surface-sunken/60"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 text-left font-mono text-[0.8125rem] font-semibold whitespace-nowrap text-ink"
                    >
                      {invoice.id}
                    </th>

                    <td className="px-6 py-4">
                      <span className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="font-medium text-ink">{invoice.reference}</span>
                        {invoice.recurring && (
                          <Badge variant="outline" size="sm" className="uppercase">
                            Recurring
                          </Badge>
                        )}
                      </span>
                    </td>

                    <td
                      data-tabular
                      className="px-6 py-4 text-[0.8125rem] whitespace-nowrap text-ink-tertiary"
                    >
                      <time dateTime={invoice.issuedOn}>
                        {shortDate.format(new Date(invoice.issuedOn))}
                      </time>
                    </td>

                    <td
                      data-tabular
                      className={cn(
                        "px-6 py-4 text-[0.8125rem] whitespace-nowrap",
                        overdue ? "font-semibold text-danger" : "text-ink-tertiary"
                      )}
                    >
                      <time dateTime={invoice.dueOn}>
                        {shortDate.format(new Date(invoice.dueOn))}
                      </time>
                    </td>

                    <td
                      data-tabular
                      className="px-6 py-4 font-semibold whitespace-nowrap text-ink"
                    >
                      {money.format(invoiceTotal(invoice))}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={invoiceStatusTone[invoice.status]}
                        className="gap-2 whitespace-nowrap"
                      >
                        <span className="relative flex size-1.5" aria-hidden>
                          {overdue && (
                            <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-75 motion-reduce:animate-none" />
                          )}
                          <span className="relative size-1.5 rounded-full bg-current" />
                        </span>
                        {invoice.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="link"
                        size="sm"
                        className="gap-1 transition-[gap] duration-(--duration-normal) hover:gap-2"
                        render={<Link href={`/client/invoices/${invoice.id}`} />}
                      >
                        View details
                        <ChevronRight />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {shown.length === 0 && (
          <p className="px-6 py-16 text-center text-ink-tertiary">
            No invoices with that status.
          </p>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-sunken/60 px-6 py-4">
          {/* Derived. The design hardcoded "1-10 of 48" above four rows. */}
          <p aria-live="polite" className="text-[0.8125rem] text-ink-tertiary">
            Showing{" "}
            <span data-tabular className="font-semibold text-ink">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span data-tabular className="font-semibold text-ink">
              {shown.length}
            </span>{" "}
            invoices
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft />
            </Button>
            <span data-tabular className="text-[0.8125rem] text-ink-tertiary">
              {current + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={current >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
