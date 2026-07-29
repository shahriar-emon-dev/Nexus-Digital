import * as React from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Direction = "up" | "down" | "flat";

/**
 * A stat tile is a hero number, not a chart. The figure carries the message and
 * the sparkline stays recessive context. The delta's direction is stated by an
 * arrow glyph and a sign as well as by colour, so it survives greyscale.
 */
export type StatCardProps = {
  label: string;
  value: string;
  /** Signed change, already formatted — e.g. "+12.4%". */
  delta?: string;
  direction?: Direction;
  /** Whether a rise is good. Revenue up = good; churn up = bad. */
  positiveIsGood?: boolean;
  caption?: string;
  icon?: LucideIcon;
  series?: number[];
  className?: string;
};

export function StatCard({
  label,
  value,
  delta,
  direction = "flat",
  positiveIsGood = true,
  caption,
  icon: Icon,
  series,
  className,
}: StatCardProps) {
  const good = direction === "flat" ? null : (direction === "up") === positiveIsGood;
  const DeltaIcon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase">
          {label}
        </p>
        {Icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-heading text-3xl leading-none font-semibold tracking-tight text-ink">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[0.8125rem] font-medium",
              good === null && "text-ink-tertiary",
              good === true && "text-success",
              good === false && "text-danger"
            )}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
            <span data-tabular>{delta}</span>
          </span>
        )}
      </div>

      {caption && <p className="mt-1.5 text-xs text-ink-tertiary">{caption}</p>}

      {series && series.length > 1 && (
        <Sparkline
          data={series}
          className="mt-4"
          tone={good === false ? "danger" : "brand"}
          label={`${label} trend`}
        />
      )}
    </Card>
  );
}

/**
 * Single-series sparkline: 2px stroke, no axes, no legend — the tile's label
 * names the series. Contextual only; every value it shows is also readable from
 * the figure above it.
 */
export function Sparkline({
  data,
  className,
  tone = "brand",
  label,
  height = 36,
}: {
  data: number[];
  className?: string;
  tone?: "brand" | "danger";
  label: string;
  height?: number;
}) {
  const id = React.useId();
  const w = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);

  const points = data.map<[number, number]>((v, i) => [
    i * step,
    height - ((v - min) / span) * (height - 4) - 2,
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const stroke = tone === "danger" ? "var(--danger)" : "var(--brand)";

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
