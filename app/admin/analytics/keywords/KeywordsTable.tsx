"use client";

import * as React from "react";
import { Download, Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  bandFor,
  difficultyBands,
  intentTone,
  keywordIntents,
  keywords,
  volumeBands,
  type KeywordIntent,
} from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const barTone = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

const textTone = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;

type SortKey = "position" | "volume" | "difficulty" | "change";

export function KeywordsTable({ domain }: { domain: string }) {
  const [intent, setIntent] = React.useState<KeywordIntent | "all">("all");
  const [band, setBand] = React.useState<(typeof difficultyBands)[number]["id"] | "all">("all");
  const [volume, setVolume] = React.useState<(typeof volumeBands)[number]["id"] | "all">("all");
  const [sort, setSort] = React.useState<SortKey>("position");
  const [descending, setDescending] = React.useState(false);

  const filtersActive = intent !== "all" || band !== "all" || volume !== "all";

  const rows = React.useMemo(() => {
    const filtered = keywords.filter((keyword) => {
      if (intent !== "all" && keyword.intent !== intent) return false;
      if (band !== "all") {
        const range = difficultyBands.find((b) => b.id === band);
        if (range && (keyword.difficulty < range.min || keyword.difficulty > range.max))
          return false;
      }
      if (volume !== "all") {
        const range = volumeBands.find((v) => v.id === volume);
        if (range && (keyword.volume < range.min || keyword.volume > range.max)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const delta = a[sort] - b[sort];
      return descending ? -delta : delta;
    });
  }, [intent, band, volume, sort, descending]);

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDescending((d) => !d);
    } else {
      setSort(key);
      // Position reads best ascending (#1 first); the rest read best descending.
      setDescending(key !== "position");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Intent">
            <Select value={intent} onChange={(v) => setIntent(v as KeywordIntent | "all")}>
              <option value="all">All intents</option>
              {keywordIntents.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Difficulty">
            <Select value={band} onChange={(v) => setBand(v as typeof band)}>
              <option value="all">Any difficulty</option>
              {difficultyBands.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Volume">
            <Select value={volume} onChange={(v) => setVolume(v as typeof volume)}>
              <option value="all">Any volume</option>
              {volumeBands.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          {/* Only offered when it would do something. */}
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIntent("all");
                setBand("all");
                setVolume("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* TODO: wire to the keywords API when it exists. */}
          <Button size="sm">
            <Plus />
            New keyword
          </Button>
          <Button variant="outline" size="sm">
            <Download />
            Export
          </Button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card variant="glass" className="min-w-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-sunken/60 px-6 py-4">
          <h2 className="font-heading text-xl font-semibold text-ink">Target tracking</h2>
          {/* Derived. The design hardcoded "Active Assets: 142" above five rows. */}
          <Badge variant="brand" className="tracking-widest uppercase">
            <span data-tabular>{rows.length}</span>
            {filtersActive ? ` of ${keywords.length}` : ""} tracked
          </Badge>
        </div>

        <p aria-live="polite" className="sr-only">
          Showing {rows.length} of {keywords.length} keywords, sorted by {sort}
          {descending ? ", descending" : ", ascending"}.
        </p>

        <div className="scrollbar-none min-w-0 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">Tracked keywords for {domain}</caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken/40">
                <th
                  scope="col"
                  className="px-6 py-4 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
                >
                  Keyword
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
                >
                  Intent
                </th>
                <SortableHeader
                  label="Volume"
                  active={sort === "volume"}
                  descending={descending}
                  onClick={() => toggleSort("volume")}
                />
                <SortableHeader
                  label="Difficulty"
                  active={sort === "difficulty"}
                  descending={descending}
                  onClick={() => toggleSort("difficulty")}
                />
                <SortableHeader
                  label="Position"
                  active={sort === "position"}
                  descending={descending}
                  onClick={() => toggleSort("position")}
                />
                <SortableHeader
                  label="Change"
                  active={sort === "change"}
                  descending={descending}
                  onClick={() => toggleSort("change")}
                />
              </tr>
            </thead>

            <tbody className="divide-y divide-line-subtle">
              {rows.map((keyword) => {
                const kd = bandFor(keyword.difficulty);
                return (
                  <tr
                    key={keyword.id}
                    className={cn(
                      "group transition-colors duration-(--duration-fast) hover:bg-surface-sunken/60",
                      keyword.focus && "bg-brand-subtle/40"
                    )}
                  >
                    <th scope="row" className="px-6 py-4 text-left font-normal">
                      <span className="block font-semibold text-ink transition-colors group-hover:text-brand">
                        {keyword.term}
                      </span>
                      <span className="block text-[0.75rem] text-ink-tertiary">
                        {domain}
                        {keyword.url}
                      </span>
                    </th>

                    <td className="px-6 py-4">
                      <Badge variant={intentTone[keyword.intent]} size="sm">
                        {keyword.intent}
                      </Badge>
                    </td>

                    <td
                      data-tabular
                      className="px-6 py-4 font-medium whitespace-nowrap text-ink-secondary"
                    >
                      {compact.format(keyword.volume)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-line"
                          role="progressbar"
                          aria-label={`Difficulty for ${keyword.term}`}
                          aria-valuenow={keyword.difficulty}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span
                            className={cn("block h-full rounded-full", barTone[kd.tone])}
                            style={{ width: `${keyword.difficulty}%` }}
                          />
                        </span>
                        <span
                          data-tabular
                          className={cn("text-[0.75rem] font-bold", textTone[kd.tone])}
                        >
                          {keyword.difficulty}%
                        </span>
                        <span className="sr-only">{kd.label}</span>
                      </span>
                    </td>

                    <td
                      data-tabular
                      className={cn(
                        "px-6 py-4 font-bold whitespace-nowrap",
                        keyword.position <= 3 ? "text-brand" : "text-ink"
                      )}
                    >
                      #{keyword.position}
                    </td>

                    <td className="px-6 py-4">
                      <Change value={keyword.change} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-6 py-16 text-center text-ink-tertiary">
            No keywords match those filters.
          </p>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="ml-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9.5 min-w-40 cursor-pointer rounded-lg border border-line bg-surface-sunken px-3",
        "text-[0.8125rem] font-medium text-ink",
        "transition-colors duration-(--duration-fast) hover:border-line-strong",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
      )}
    >
      {children}
    </select>
  );
}

function SortableHeader({
  label,
  active,
  descending,
  onClick,
}: {
  label: string;
  active: boolean;
  descending: boolean;
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (descending ? "descending" : "ascending") : "none"}
      className="px-6 py-4"
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-1 rounded text-[0.6875rem] font-semibold tracking-widest uppercase",
          "transition-colors duration-(--duration-fast)",
          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
          active ? "text-brand" : "text-ink-tertiary hover:text-ink"
        )}
      >
        {label}
        <span aria-hidden className={cn("text-[0.625rem]", !active && "opacity-0")}>
          {descending ? "▼" : "▲"}
        </span>
      </button>
    </th>
  );
}

function Change({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-ink-tertiary">
        <Minus className="size-3.5" aria-hidden />
        <span className="sr-only">No change</span>
        <span aria-hidden data-tabular>
          0
        </span>
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
