import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarDays,
  Globe,
  Minus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  coreWebVitals,
  deviceSplit,
  healthFactors,
  healthScore,
  intentTone,
  lastAuditAt,
  seoDaily,
  seoKpis,
  seoProperties,
  topKeywords,
} from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Sparkline } from "@/components/admin/Sparkline";
import { TrafficChart } from "@/components/admin/TrafficChart";

export const metadata: Metadata = { title: "SEO Performance" };

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const stamp = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function AdminSeoPage() {
  const property = seoProperties[0];

  return (
    <>
      

      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <Breadcrumbs items={[
          { label: "Command Center", href: "/admin" },
          { label: "Analytics", href: "/admin/analytics" },
          { label: "SEO" },
        ]} />
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
              SEO Performance Overview
            </h1>
            <p className="mt-2 max-w-xl text-ink-tertiary">
              Technical SEO analytics and visibility tracking across the estate.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* TODO: make these real selectors once the properties API lands —
                switching them must refetch the series, not just relabel it. */}
            <Card variant="glass" className="flex-row items-center gap-2 rounded-xl px-4 py-2.5">
              <Globe className="size-4 shrink-0 text-brand" aria-hidden />
              <span className="text-[0.8125rem] font-semibold text-ink">
                {property.domain}
              </span>
            </Card>
            <Card variant="glass" className="flex-row items-center gap-2 rounded-xl px-4 py-2.5">
              <CalendarDays className="size-4 shrink-0 text-ion" aria-hidden />
              <span className="text-[0.8125rem] font-semibold text-ink">
                Last <span data-tabular>{seoDaily.length}</span> days
              </span>
            </Card>
          </div>
        </header>

        {/* ── KPIs ──────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {seoKpis.map((kpi) => {
            const improving = kpi.higherIsBetter ? kpi.delta > 0 : kpi.delta < 0;
            const flat = Math.abs(kpi.delta) < 0.05;
            const Icon = flat ? Minus : improving ? TrendingUp : TrendingDown;
            return (
              <Card key={kpi.id} variant="glass" lift className="gap-4 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] text-ink-tertiary">{kpi.label}</p>
                    <p
                      data-tabular
                      className="mt-1 font-heading text-[2rem] leading-tight font-bold text-ink"
                    >
                      {kpi.value}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-[0.8125rem] font-semibold",
                      flat ? "text-ink-tertiary" : improving ? "text-success" : "text-danger"
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span data-tabular>
                      {kpi.delta > 0 ? "+" : ""}
                      {kpi.delta.toFixed(1)}%
                    </span>
                    <span className="sr-only">
                      {flat
                        ? "unchanged"
                        : improving
                          ? "improving versus the previous period"
                          : "declining versus the previous period"}
                    </span>
                  </span>
                </div>
                <Sparkline
                  series={kpi.series}
                  tone={kpi.tone}
                  invert={!kpi.higherIsBetter}
                />
              </Card>
            );
          })}
        </section>

        {/* ── Traffic ───────────────────────────────────────────────────── */}
        <Card variant="glass" className="gap-6 rounded-3xl p-6 md:p-8">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink">
              Organic search traffic
            </h2>
            <p className="mt-1 text-ink-tertiary">
              Clicks against impressions. Each series has its own scale — hover to
              read a day.
            </p>
          </div>
          <TrafficChart days={seoDaily} />
        </Card>

        {/* ── Keywords + panels ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          {/* `overflow-hidden` is load-bearing here: without it the wide table
              inside the scroll container still stretches the page, and the
              whole document scrolls sideways on a phone. */}
          <Card
            variant="glass"
            className="min-w-0 gap-0 overflow-hidden rounded-3xl p-6 xl:col-span-2"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="font-heading text-xl font-semibold text-ink">Top keywords</h2>
              <Button
                variant="link"
                size="sm"
                className="gap-1 transition-[gap] duration-(--duration-normal) hover:gap-2"
                render={<Link href="/admin/analytics/keywords" />}
              >
                View all
                <ArrowRight />
              </Button>
            </div>

            <div className="scrollbar-none min-w-0 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">
                  The five best-ranking tracked keywords
                </caption>
                <thead>
                  <tr className="border-b border-line">
                    {["Keyword", "Intent", "Position", "Change", "Volume"].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={cn(
                          "pb-3 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase",
                          i >= 2 && i <= 3 && "text-center",
                          i === 4 && "text-right"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {topKeywords.map((keyword) => (
                    <tr
                      key={keyword.id}
                      className="transition-colors duration-(--duration-fast) hover:bg-surface-sunken/60"
                    >
                      <th scope="row" className="py-3.5 pr-4 text-left font-normal">
                        <span className="block font-medium text-ink">{keyword.term}</span>
                        <span className="block text-[0.75rem] text-ink-tertiary">
                          {property.domain}
                          {keyword.url}
                        </span>
                      </th>
                      <td className="py-3.5 pr-4">
                        <Badge variant={intentTone[keyword.intent]} size="sm">
                          {keyword.intent}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-center">
                        <Badge
                          variant={keyword.position <= 3 ? "brand" : "default"}
                          size="sm"
                          data-tabular
                        >
                          #{keyword.position}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-center">
                        <Change value={keyword.change} />
                      </td>
                      <td
                        data-tabular
                        className="py-3.5 text-right whitespace-nowrap text-ink-secondary"
                      >
                        {compact.format(keyword.volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <DeviceSplit />

            <Card variant="glass" className="border-beam gap-5 rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-ink">
                    SEO health score
                  </h2>
                  <p
                    data-tabular
                    className="mt-2 font-heading text-[2.5rem] leading-none font-bold text-brand"
                  >
                    {healthScore}
                  </p>
                  <p className="mt-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                    Weighted across {healthFactors.length} factors
                  </p>
                </div>
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
                  <ShieldCheck className="size-6" aria-hidden />
                </span>
              </div>

              {/* The score is a weighted mean of exactly these, so both can be
                  read together rather than taken on trust. */}
              <dl className="flex flex-col gap-3">
                {healthFactors.map((factor) => (
                  // dt/dd sit directly in the single permitted wrapper <div>;
                  // nesting them a second level deep is invalid markup.
                  <div
                    key={factor.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3"
                  >
                    <dt className="text-[0.8125rem] text-ink-tertiary">{factor.label}</dt>
                    <dd data-tabular className="text-[0.8125rem] font-semibold text-ink">
                      {factor.score}
                    </dd>
                    <div
                      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line"
                      role="progressbar"
                      aria-label={factor.label}
                      aria-valuenow={factor.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </dl>

              <p className="text-[0.75rem] text-ink-tertiary">
                Last audit{" "}
                <time dateTime={lastAuditAt} data-tabular>
                  {stamp.format(new Date(lastAuditAt))} UTC
                </time>
              </p>
            </Card>

            <Card variant="glass" className="gap-4 rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold text-ink">
                  Core Web Vitals
                </h2>
                <Badge variant={coreWebVitals.passing ? "success" : "danger"}>
                  {coreWebVitals.passing ? "Passing" : "Failing"}
                </Badge>
              </div>
              <dl className="grid grid-cols-3 gap-3">
                {coreWebVitals.metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-xl border border-line bg-surface-sunken p-3"
                  >
                    <dt className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                      {metric.label}
                    </dt>
                    <dd
                      data-tabular
                      className={cn(
                        "mt-1 font-heading text-lg font-semibold",
                        metric.pass ? "text-success" : "text-danger"
                      )}
                    >
                      {metric.value}
                    </dd>
                    <p data-tabular className="text-[0.625rem] text-ink-tertiary">
                      budget {metric.budget}
                    </p>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}

function Change({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-ink-tertiary">
        <Minus className="size-3.5" aria-hidden />
        <span className="sr-only">No change</span>
        <span aria-hidden>0</span>
      </span>
    );
  }
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.8125rem] font-semibold",
        up ? "text-success" : "text-danger"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span data-tabular>{Math.abs(value)}</span>
      <span className="sr-only">places {up ? "gained" : "lost"}</span>
    </span>
  );
}

/** Donut built from the split, with the arcs derived rather than hand-typed. */
function DeviceSplit() {
  const R = 15.915; // circumference is 100, so shares map straight to dasharray
  let offset = 0;

  return (
    <Card variant="glass" className="gap-6 rounded-3xl p-6">
      <h2 className="font-heading text-xl font-semibold text-ink">Device distribution</h2>
      <div className="flex items-center gap-8">
        <div className="relative size-32 shrink-0">
          <svg viewBox="0 0 36 36" aria-hidden focusable="false" className="size-full -rotate-90">
            <circle cx="18" cy="18" r={R} fill="none" stroke="var(--line)" strokeWidth="4" />
            {deviceSplit.map((device) => {
              const dash = `${device.share} ${100 - device.share}`;
              const node = (
                <circle
                  key={device.id}
                  cx="18"
                  cy="18"
                  r={R}
                  fill="none"
                  stroke={device.tone === "ion" ? "var(--ion)" : "var(--brand)"}
                  strokeWidth="4"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                />
              );
              offset += device.share;
              return node;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
              {deviceSplit[0].label}
            </span>
            <span data-tabular className="font-heading text-lg font-bold text-ink">
              {deviceSplit[0].share}%
            </span>
          </div>
        </div>

        <dl className="flex flex-col gap-3">
          {deviceSplit.map((device) => (
            <div key={device.id} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  device.tone === "ion" ? "bg-ion" : "bg-brand"
                )}
              />
              <dt className="text-[0.8125rem] text-ink-tertiary">{device.label}</dt>
              <dd data-tabular className="text-[0.8125rem] font-semibold text-ink">
                {device.share}%
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}
