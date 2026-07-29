import { cn } from "@/lib/utils";

const sprints = [
  { label: "S9", value: 34 },
  { label: "S10", value: 58 },
  { label: "S11", value: 47 },
  { label: "S12", value: 82 },
  { label: "S13", value: 61 },
  { label: "S14", value: 94, current: true },
];

/**
 * Single-series bar chart: story points completed per sprint.
 *
 * All bars share one colour because they are one series — the source ramped
 * opacity with height, which spends the colour channel re-encoding what bar
 * length already shows. Only the current sprint is picked out, and that marks
 * recency, not magnitude. Hover shows a read-out rather than resizing the bar:
 * changing a bar's height on hover misstates the value it encodes.
 */
export function SprintVelocity() {
  const max = Math.max(...sprints.map((s) => s.value));

  return (
    <figure className="w-full md:w-80">
      <figcaption className="mb-2 flex items-baseline justify-between text-[0.6875rem] text-ink-tertiary">
        <span className="font-medium text-ink-secondary">Story points completed</span>
        <span>last 6 sprints</span>
      </figcaption>

      <div className="flex h-48 items-end gap-[2px] rounded-2xl border border-line-subtle bg-surface-sunken p-4">
        {sprints.map((sprint) => (
          <div key={sprint.label} className="group/bar relative flex h-full flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-opacity duration-(--duration-fast) group-hover/bar:opacity-80",
                sprint.current ? "bg-brand" : "bg-chart-1"
              )}
              style={{ height: `${(sprint.value / max) * 100}%` }}
            />
            <span
              data-tabular
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border border-line bg-surface-raised px-2 py-1 text-[0.625rem] whitespace-nowrap text-ink opacity-0 shadow-e2 transition-opacity duration-(--duration-fast) group-hover/bar:opacity-100"
            >
              {sprint.label} · {sprint.value} pts
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex gap-[2px] px-4">
        {sprints.map((sprint) => (
          <span
            key={sprint.label}
            className={cn(
              "flex-1 text-center text-[0.625rem]",
              sprint.current ? "font-semibold text-brand" : "text-ink-tertiary"
            )}
          >
            {sprint.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
