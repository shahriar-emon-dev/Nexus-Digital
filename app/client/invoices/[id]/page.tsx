import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle, Download, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  billingParties,
  invoiceById,
  invoiceStatusTone,
  invoiceTotals,
  invoices,
  money,
} from "@/lib/invoices";
import { listProjects } from "@/lib/supabase/project-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PaymentPanel, PrintButton } from "./PaymentPanel";

type Params = { params: { id: string } };

export function generateStaticParams() {
  return invoices.map((invoice) => ({ id: invoice.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const invoice = invoiceById(params.id);
  return { title: invoice ? invoice.id : "Invoice not found" };
}

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export default async function InvoiceDetailPage({ params }: Params) {
  const invoice = invoiceById(params.id);
  if (!invoice) notFound();

  const totals = invoiceTotals(invoice);
  const overdue = invoice.status === "Overdue";
  const project = (await listProjects()).find((p) => p.id === invoice.projectId);

  return (
    <>
      <DashboardHeader
        title={invoice.id}
        titleAs="p"
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Invoices", href: "/client/invoices" },
          { label: invoice.id },
        ]}
      />

      <div className="flex flex-col gap-10 px-5 py-10 lg:px-10">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-4 font-heading text-[2.5rem] leading-tight font-bold tracking-tight text-ink">
              {invoice.id}
              <Badge
                variant={invoiceStatusTone[invoice.status]}
                size="lg"
                className="gap-2 tracking-wider uppercase"
              >
                {overdue && <AlertCircle className="size-4" aria-hidden />}
                {invoice.status}
              </Badge>
              {invoice.recurring && (
                <Badge variant="brand" size="lg" className="gap-2 tracking-wider uppercase">
                  <RefreshCw className="size-4" aria-hidden />
                  Recurring
                </Badge>
              )}
            </h1>
            <p className="mt-3 text-ink-tertiary">
              {invoice.reference}
              {project && (
                <>
                  {" · "}
                  <Link
                    href={project.href}
                    className="rounded-sm text-brand underline underline-offset-4 decoration-brand/40 hover:decoration-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                  >
                    {project.name}
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* TODO: generate the PDF server-side once billing is wired. */}
            <Button variant="outline">
              <Download />
              Download PDF
            </Button>
            <PrintButton />
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* ── Document ────────────────────────────────────────────────── */}
          <Card
            variant="glass"
            className="relative gap-0 overflow-hidden rounded-3xl p-8 md:p-12 lg:col-span-2"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-6 right-8 font-heading text-[4rem] leading-none font-bold text-ink opacity-[0.06] select-none"
            >
              NEXUS
            </span>

            <div className="relative mb-12 grid grid-cols-1 gap-10 md:grid-cols-2">
              <Party label="From" party={billingParties.from} />
              <Party label="Bill to" party={billingParties.to} align="md:text-right" />
            </div>

            <dl className="mb-10 grid grid-cols-2 gap-6 rounded-2xl bg-surface-sunken p-6 md:grid-cols-4">
              <Fact label="Issue date">
                <time dateTime={invoice.issuedOn}>
                  {longDate.format(new Date(invoice.issuedOn))}
                </time>
              </Fact>
              <Fact label="Due date" tone={overdue ? "text-danger" : undefined}>
                <time dateTime={invoice.dueOn}>
                  {longDate.format(new Date(invoice.dueOn))}
                </time>
              </Fact>
              <Fact label="Billing period">{invoice.billingPeriod}</Fact>
              <Fact label="Currency">{invoice.currency} ($)</Fact>
            </dl>

            {/* ── Line items ──────────────────────────────────────────── */}
            <div className="scrollbar-none mb-10 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Line items for {invoice.id}</caption>
                <thead>
                  <tr className="border-b border-line text-ink-tertiary">
                    <th
                      scope="col"
                      className="pb-4 text-[0.6875rem] font-semibold tracking-widest uppercase"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="pb-4 text-right text-[0.6875rem] font-semibold tracking-widest uppercase"
                    >
                      Unit price
                    </th>
                    <th
                      scope="col"
                      className="pb-4 text-center text-[0.6875rem] font-semibold tracking-widest uppercase"
                    >
                      Qty / hrs
                    </th>
                    <th
                      scope="col"
                      className="pb-4 text-right text-[0.6875rem] font-semibold tracking-widest uppercase"
                    >
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {invoice.lines.map((line) => (
                    <tr
                      key={line.id}
                      className="transition-colors duration-(--duration-fast) hover:bg-surface-sunken/50"
                    >
                      <th scope="row" className="py-5 pr-4 text-left font-normal">
                        <span className="block font-semibold text-ink">
                          {line.description}
                        </span>
                        <span className="block text-[0.8125rem] text-ink-tertiary">
                          {line.detail}
                        </span>
                      </th>
                      <td
                        data-tabular
                        className="py-5 text-right whitespace-nowrap text-ink-secondary"
                      >
                        {money.format(line.unitPrice)}
                      </td>
                      <td data-tabular className="py-5 text-center text-ink-secondary">
                        {line.quantity.toFixed(2)}
                      </td>
                      <td
                        data-tabular
                        className="py-5 text-right font-semibold whitespace-nowrap text-ink"
                      >
                        {money.format(line.unitPrice * line.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Totals ──────────────────────────────────────────────── */}
            <div className="flex justify-end">
              <dl className="flex w-full flex-col gap-3 md:w-80">
                <Row label="Subtotal" value={money.format(totals.subtotal)} />
                {invoice.discountRate > 0 && (
                  <Row
                    label={`Discount (${Math.round(invoice.discountRate * 100)}%)`}
                    value={`−${money.format(totals.discount)}`}
                    tone="text-success"
                  />
                )}
                <Row
                  label={`Tax (${Math.round(invoice.taxRate * 100)}%)`}
                  value={money.format(totals.tax)}
                />
                <div className="mt-2 flex items-end justify-between gap-4 border-t border-line-strong pt-4">
                  <dt className="font-heading text-lg font-semibold text-ink">Total due</dt>
                  <dd
                    data-tabular
                    className="font-heading text-[2rem] leading-none font-bold tracking-tight text-brand"
                  >
                    {money.format(totals.total)}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="mt-10 border-t border-line-subtle pt-8 text-[0.8125rem] text-ink-tertiary">
              <strong className="text-ink-secondary">Notes:</strong> {invoice.notes}
            </p>
          </Card>

          {/* ── Payment ─────────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <PaymentPanel
              invoiceId={invoice.id}
              amount={totals.total}
              paid={invoice.status === "Paid"}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function Party({
  label,
  party,
  align,
}: {
  label: string;
  party: { name: string; taxId?: string; attn?: string; lines: string[]; email: string };
  align?: string;
}) {
  return (
    <div className={align}>
      <p className="mb-3 text-[0.6875rem] font-semibold tracking-widest text-brand uppercase">
        {label}
      </p>
      <p className="mb-2 font-heading text-xl font-semibold text-ink">{party.name}</p>
      <address className="flex flex-col gap-0.5 text-[0.875rem] text-ink-tertiary not-italic">
        {party.taxId && <span>Tax ID: {party.taxId}</span>}
        {party.attn && <span>{party.attn}</span>}
        {party.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
        <a
          href={`mailto:${party.email}`}
          className="rounded-sm underline-offset-4 hover:text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        >
          {party.email}
        </a>
      </address>
    </div>
  );
}

function Fact({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-1 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
        {label}
      </dt>
      <dd data-tabular className={cn("font-semibold text-ink", tone)}>
        {children}
      </dd>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={cn("flex justify-between gap-4 text-ink-tertiary", tone)}>
      <dt>{label}</dt>
      <dd data-tabular>{value}</dd>
    </div>
  );
}
