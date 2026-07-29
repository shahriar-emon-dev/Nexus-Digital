"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Assumptions behind the projection, stated rather than buried in the code. */
const AVERAGE_ORDER_VALUE = 100;
const PERFORMANCE_LIFT = 0.35;
const MONTHS = 12;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Slider({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-secondary">
          {label}
        </label>
        <output htmlFor={id} data-tabular className="font-bold text-brand">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        className={cn(
          "h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-sunken accent-brand",
          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        )}
      />
    </div>
  );
}

export function RoiForecaster() {
  const [traffic, setTraffic] = React.useState(50_000);
  const [conversion, setConversion] = React.useState(2.5);

  const lift = traffic * (conversion / 100) * AVERAGE_ORDER_VALUE * PERFORMANCE_LIFT * MONTHS;

  return (
    <div className="border-beam glass rounded-xl p-8">
      <h2 className="mb-6 flex items-center gap-3 font-heading text-2xl font-semibold text-ink">
        <BarChart3 className="size-6 text-brand" aria-hidden />
        ROI Forecaster
      </h2>

      <div className="flex flex-col gap-8">
        <Slider
          id="roi-traffic"
          label="Monthly Traffic"
          value={traffic}
          display={traffic.toLocaleString("en-US")}
          min={1000}
          max={500_000}
          step={1000}
          onChange={setTraffic}
        />
        <Slider
          id="roi-conversion"
          label="Conversion Rate"
          value={conversion}
          display={`${conversion.toFixed(1)}%`}
          min={0.1}
          max={10}
          step={0.1}
          onChange={setConversion}
        />

        <div className="mt-8 rounded-lg border border-brand/20 bg-brand/10 p-6">
          <p className="mb-2 text-xs font-bold tracking-widest text-brand uppercase">
            Projected Revenue Lift
          </p>
          <p className="flex items-baseline gap-2">
            <span
              data-tabular
              className="font-heading text-4xl font-bold text-brand"
              aria-live="polite"
            >
              {money.format(lift)}
            </span>
            <span className="text-sm text-ink-tertiary">/ year</span>
          </p>
          {/* The source stated only the 35% figure, leaving the $100 order value
              as an unexplained constant inside the script. Both are named here —
              a projection you cannot audit is not a projection. */}
          <p className="mt-3 text-[0.625rem] leading-tight text-ink-tertiary">
            Assumes a {money.format(AVERAGE_ORDER_VALUE)} average order value and a{" "}
            {PERFORMANCE_LIFT * 100}% conversion uplift from Core Web Vitals improvements,
            projected over {MONTHS} months.
          </p>
        </div>
      </div>
    </div>
  );
}
