"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
} as const;

function Progress({
  className,
  tone = "brand",
  size = "default",
  ...props
}: ProgressPrimitive.Root.Props & {
  tone?: keyof typeof tones;
  size?: "sm" | "default" | "lg";
}) {
  const heights = { sm: "h-1", default: "h-1.5", lg: "h-2.5" } as const;
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn("w-full", className)} {...props}>
      <ProgressPrimitive.Track
        className={cn("w-full overflow-hidden rounded-full bg-surface-sunken", heights[size])}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full rounded-full transition-[width] duration-(--duration-slow) ease-(--ease-out-expo)",
            tones[tone]
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

/**
 * Circular completion meter. `size` is the outer diameter in px; the stroke is
 * derived so the ring reads the same at any size.
 */
function ProgressRing({
  value,
  size = 44,
  tone = "brand",
  label,
  className,
}: {
  value: number;
  size?: number;
  tone?: keyof typeof tones;
  label?: React.ReactNode;
  className?: string;
}) {
  const stroke = Math.max(3, Math.round(size * 0.09));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const strokeColor = {
    brand: "var(--brand)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
  }[tone];

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${pct}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-[stroke-dashoffset] duration-(--duration-deliberate) ease-(--ease-out-expo)"
        />
      </svg>
      <span
        data-tabular
        className="absolute text-[0.6875rem] font-semibold text-ink"
        aria-hidden
      >
        {label ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

export { Progress, ProgressRing };
