import { cn } from "@/lib/utils";

/**
 * Trend line for a KPI card.
 *
 * The path is generated from the series, so the shape actually reflects the
 * number printed above it — the source designs used the same three decorative
 * curves regardless of the metric. Purely supporting art: it carries no labels
 * and is hidden from assistive tech, since the figure and its change are both
 * already stated in text.
 */
export function Sparkline({
  series,
  tone = "brand",
  invert = false,
  className,
}: {
  series: number[];
  tone?: "brand" | "ion";
  /** For metrics where lower is better, so the line reads the way it behaves. */
  invert?: boolean;
  className?: string;
}) {
  if (series.length < 2) return null;

  const W = 100;
  const H = 32;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  const points = series.map((value, i) => {
    const x = (i / (series.length - 1)) * W;
    const t = (value - min) / span;
    // SVG y grows downward, so a high value is a low y.
    const y = H - (invert ? 1 - t : t) * (H - 4) - 2;
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const id = `spark-${tone}-${series.length}-${Math.round(min)}-${Math.round(max)}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={cn("h-10 w-full", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stopColor={tone === "ion" ? "var(--ion)" : "var(--brand)"}
            stopOpacity="0.28"
          />
          <stop
            offset="100%"
            stopColor={tone === "ion" ? "var(--ion)" : "var(--brand)"}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={tone === "ion" ? "var(--ion)" : "var(--brand)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
