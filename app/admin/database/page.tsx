import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  Database,
  Download,
  Gauge,
  RefreshCw,
  Sparkles,
  Timer,
  TrendingDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  cacheStats,
  connectionLoadPct,
  latencyStats,
  memoryPct,
  samples,
  serviceById,
  serviceStatusTone,
  slowQueries,
  systemEvents,
  throughputStats,
  topRecommendation,
} from "@/lib/infrastructure";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CacheChart } from "@/components/admin/CacheChart";
import { QueryInspector } from "@/components/admin/QueryInspector";
import { ThroughputChart } from "@/components/admin/ThroughputChart";

export const metadata: Metadata = { title: "Query Intelligence" };

const full = new Intl.NumberFormat("en-US");

export default function AdminDatabasePage() {
  const postgres = serviceById("postgres")!;
  const redis = serviceById("redis")!;
  const advisory = slowQueries.find((q) => q.id === topRecommendation.queryId);

  return (
    <>
      

      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <Breadcrumbs items={[
          { label: "Command Center", href: "/admin" },
          { label: "System Security", href: "/admin/database" },
          { label: "Query Intelligence" },
        ]} />
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
              Query Intelligence
            </h1>
            <p className="mt-2 max-w-xl text-ink-tertiary">
              Database health and performance across the last six hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* TODO: wire both to the metrics API. */}
            <Button variant="outline">
              <Download />
              Export report
            </Button>
            <Button className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105">
              <RefreshCw />
              Force sync
            </Button>
          </div>
        </header>

        {/* ── Service health ────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card variant="glass" lift className="group gap-5 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand transition-transform duration-(--duration-slow) group-hover:scale-110">
                <Database className="size-6" aria-hidden />
              </span>
              <StatusPill status={postgres.status} />
            </div>

            <h2 className="font-heading text-lg font-semibold text-ink">{postgres.name}</h2>

            <dl className="flex flex-col gap-4">
              <Row label="Uptime" value={`${postgres.uptimePct}%`} />
              <Meter
                label="Connection pool"
                value={connectionLoadPct(postgres)}
                readout={`${full.format(postgres.connections!.open)} / ${full.format(
                  postgres.connections!.max
                )}`}
                tone="brand"
              />
            </dl>
          </Card>

          <Card variant="glass" lift className="border-beam group gap-5 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ion-subtle text-ion transition-transform duration-(--duration-slow) group-hover:scale-110">
                <Gauge className="size-6" aria-hidden />
              </span>
              <StatusPill status={redis.status} />
            </div>

            <h2 className="font-heading text-lg font-semibold text-ink">{redis.name}</h2>

            <dl className="flex flex-col gap-4">
              {/* Derived from the samples, not stored beside them. */}
              <Row
                label="Hit rate"
                value={`${cacheStats.hitRate.toFixed(1)}%`}
                tone="text-ion"
              />
              <Meter
                label="Memory"
                value={memoryPct(redis)}
                readout={`${(redis.memory!.usedMb / 1024).toFixed(1)} GB / ${(
                  redis.memory!.totalMb / 1024
                ).toFixed(0)} GB`}
                tone="ion"
              />
              <Row label="Evictions" value={full.format(redis.evictions ?? 0)} />
            </dl>
          </Card>

          <Card variant="glass" lift className="group gap-5 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-chart-3/10 text-chart-3 transition-transform duration-(--duration-slow) group-hover:scale-110">
                <Timer className="size-6" aria-hidden />
              </span>
              {latencyStats.trend.improving && (
                <Badge variant="success" className="gap-1.5 tracking-wider uppercase">
                  <TrendingDown className="size-3.5" aria-hidden />
                  Improving
                </Badge>
              )}
            </div>

            <h2 className="font-heading text-lg font-semibold text-ink">
              Query latency (P99)
            </h2>

            <div className="flex items-baseline gap-2">
              <span
                data-tabular
                className="font-heading text-[2.5rem] leading-none font-bold text-ink"
              >
                {latencyStats.current}
              </span>
              <span className="font-semibold text-ink-tertiary">ms</span>
              <span data-tabular className="text-[0.75rem] text-ink-tertiary">
                now · {latencyStats.typical} ms typical
              </span>
            </div>

            <dl className="flex flex-col gap-4">
              <Row
                label="Peak in window"
                value={`${latencyStats.peak} ms`}
                tone="text-danger"
              />
              <Row
                label="Average TPS"
                value={full.format(throughputStats.average)}
              />
            </dl>
          </Card>
        </section>

        {/* ── Charts ────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card variant="glass" className="min-h-[24rem] gap-6 rounded-3xl p-6 md:p-8">
            <div>
              <h2 className="font-heading text-xl font-semibold text-ink">
                Transaction throughput
              </h2>
              <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
                Peak <span data-tabular>{full.format(throughputStats.peak)}</span> TPS
                across the window.
              </p>
            </div>
            <ThroughputChart samples={samples} />
          </Card>

          <Card variant="glass" className="min-h-[24rem] gap-6 rounded-3xl p-6 md:p-8">
            <div>
              <h2 className="font-heading text-xl font-semibold text-ink">
                Cache hits and misses
              </h2>
              <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
                <span data-tabular>{full.format(cacheStats.misses)}</span> misses out of{" "}
                <span data-tabular>{full.format(cacheStats.hits + cacheStats.misses)}</span>{" "}
                lookups.
              </p>
            </div>
            <CacheChart samples={samples} />
          </Card>
        </section>

        {/* ── Queries + events ──────────────────────────────────────────── */}
        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <QueryInspector />
          </div>

          <Card variant="glass" className="gap-0 rounded-3xl">
            <div className="border-b border-line px-6 py-5">
              <h2 className="font-heading text-xl font-semibold text-ink">System events</h2>
            </div>

            <ul className="flex flex-col gap-3 p-4">
              {systemEvents.map((event) => (
                <li key={event.id}>
                  <div
                    className={cn(
                      "rounded-2xl border p-4",
                      "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
                      "hover:-translate-y-0.5",
                      event.kind === "running"
                        ? "border-brand-line bg-brand-subtle/40"
                        : "border-line bg-surface-sunken hover:border-brand-line",
                      event.kind === "scheduled" && "opacity-75"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <EventIcon kind={event.kind} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[0.875rem] font-semibold text-ink">
                          {event.title}
                        </h3>
                        <p className="mt-1 text-[0.75rem] text-ink-tertiary">
                          {event.detail}
                        </p>

                        {event.kind === "running" && event.progress !== undefined && (
                          <div
                            className="mt-3 h-1 overflow-hidden rounded-full bg-line"
                            role="progressbar"
                            aria-label={`${event.title} progress`}
                            aria-valuenow={event.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${event.progress}%` }}
                            />
                          </div>
                        )}

                        <p
                          data-tabular
                          className={cn(
                            "mt-2 font-mono text-[0.6875rem]",
                            event.kind === "running" ? "text-brand" : "text-ink-tertiary"
                          )}
                        >
                          {event.when}
                          {event.kind === "running" && event.progress !== undefined
                            ? ` · ${event.progress}%`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ── Advisory ──────────────────────────────────────────────────── */}
        {advisory && (
          <Card
            variant="glass"
            className="border-beam flex-col items-start justify-between gap-6 rounded-2xl p-6 md:flex-row md:items-center"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ion-subtle text-ion">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">
                  Performance recommendation
                </h2>
                <p className="mt-1 text-[0.875rem] text-ink-secondary">
                  {advisory.suggestion} Estimated to cut P99 by roughly{" "}
                  <span data-tabular className="font-semibold text-ion">
                    {topRecommendation.estimatedGainPct}%
                  </span>{" "}
                  on <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-brand">
                    {advisory.table}
                  </code>
                  .
                </p>
              </div>
            </div>
            <Button variant="outline" className="shrink-0">
              Review implementation
            </Button>
          </Card>
        )}
      </div>
    </>
  );
}

function StatusPill({ status }: { status: keyof typeof serviceStatusTone }) {
  return (
    <Badge variant={serviceStatusTone[status]} className="gap-2 tracking-wider uppercase">
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-75 motion-reduce:animate-none" />
        <span className="relative size-1.5 rounded-full bg-current" />
      </span>
      {status}
    </Badge>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[0.8125rem] text-ink-tertiary">{label}</dt>
      <dd data-tabular className={cn("font-semibold text-ink", tone)}>
        {value}
      </dd>
    </div>
  );
}

function Meter({
  label,
  value,
  readout,
  tone,
}: {
  label: string;
  value: number;
  readout: string;
  tone: "brand" | "ion";
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <dt className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
          {label}
        </dt>
        <dd data-tabular className="text-[0.75rem] font-medium text-ink">
          {readout}
        </dd>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full",
            tone === "ion" ? "bg-ion" : "bg-brand shadow-[0_0_12px_var(--brand-glow)]"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function EventIcon({ kind }: { kind: "success" | "running" | "scheduled" }) {
  const map = {
    success: { Icon: CheckCircle2, cls: "bg-success-subtle text-success" },
    running: { Icon: RefreshCw, cls: "bg-brand-subtle text-brand" },
    scheduled: { Icon: Clock, cls: "bg-surface-raised text-ink-tertiary" },
  } as const;
  const { Icon, cls } = map[kind];
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", cls)}>
      <Icon
        className={cn(
          "size-4",
          kind === "running" && "animate-spin [animation-duration:3s] motion-reduce:animate-none"
        )}
        aria-hidden
      />
    </span>
  );
}
