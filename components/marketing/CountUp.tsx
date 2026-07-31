"use client";

import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { cn } from "@/lib/utils";

const tones = {
  ink: "text-ink",
  brand: "text-brand",
  ion: "text-ion",
  orchid: "text-chart-3",
} as const;

const sizes = {
  default: { figure: "text-h3", label: "text-[0.8125rem] text-ink-tertiary" },
  stat: { figure: "text-[2.625rem] leading-none", label: "text-[0.8125rem] text-ink-tertiary" },
  display: {
    figure: "text-[3rem] lg:text-[4.5rem] leading-none",
    label:
      "text-[0.8125rem] font-semibold tracking-[0.2em] uppercase text-ink-tertiary",
  },
} as const;

/**
 * Animated figure. The accessible name carries the final value as plain text, so
 * assistive tech never has to read a spinning counter — the rolling digits are
 * `aria-hidden` decoration over a static, correct label.
 */
export function CountUp({
  value,
  prefix,
  suffix,
  label,
  decimalPlaces = 0,
  tone = "ink",
  size = "default",
  align = "start",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimalPlaces?: number;
  tone?: keyof typeof tones;
  size?: keyof typeof sizes;
  align?: "start" | "center";
  className?: string;
}) {
  const display = `${prefix ?? ""}${value.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
  })}${suffix ?? ""}`;
  const s = sizes[size];

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <p
        className={cn(
          "flex items-baseline font-heading font-bold tracking-tight",
          s.figure,
          tones[tone]
        )}
        // `aria-label` is prohibited on a <p>; `role="img"` gives it an element
        // type that accepts one, so the figure is announced as a single unit.
        role="img"
        aria-label={`${display} ${label}`}
      >
        <span aria-hidden className="flex items-baseline">
          {prefix}
          <SlidingNumber number={value} decimalPlaces={decimalPlaces} thousandSeparator="," />
          {suffix}
        </span>
      </p>
      <p className={s.label} aria-hidden>
        {label}
      </p>
    </div>
  );
}
