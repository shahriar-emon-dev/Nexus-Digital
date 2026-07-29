"use client";

import * as React from "react";
import { Maximize2, Pause, Play, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const pad = (n: number) => n.toString().padStart(2, "0");
const format = (total: number) =>
  `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;

/**
 * Persistent time tracker. Lives in the staff layout so it survives navigation
 * between `/staff/*` routes.
 *
 * Two things the source got wrong and this does not: the interval is cleared on
 * unmount (its `setInterval` ran forever and kept a closure alive), and the
 * elapsed value is state rather than a string scraped out of the DOM by class
 * name — that selector broke the moment the markup was restyled.
 */
export function FloatingTimer({
  project = "OmniPay Global",
  task = "API Authentication Layer",
  startSeconds = 6125,
}: {
  project?: string;
  task?: string;
  startSeconds?: number;
}) {
  const [elapsed, setElapsed] = React.useState(startSeconds);
  const [running, setRunning] = React.useState(true);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <aside
      aria-label="Active time tracker"
      className={cn(
        "glass fixed right-4 bottom-4 z-50 w-72 rounded-xl p-4 shadow-e4",
        "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
        "hover:-translate-y-0.5 hover:border-brand-line"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2">
          <span className="relative flex size-2" aria-hidden>
            {running && (
              <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-70 motion-reduce:animate-none" />
            )}
            <span
              className={cn(
                "relative size-2 rounded-full",
                running ? "bg-brand" : "bg-ink-tertiary"
              )}
            />
          </span>
          <span className="text-[0.625rem] font-semibold tracking-wider text-brand uppercase">
            {running ? "Active timer" : "Paused"}
          </span>
        </p>
        <Button variant="ghost" size="icon-xs" aria-label="Expand timer">
          <Maximize2 />
        </Button>
      </div>

      <div className="mb-4 min-w-0">
        <p className="truncate text-sm font-medium text-ink">{project}</p>
        <p className="truncate text-xs text-ink-tertiary">{task}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* aria-live off: a counter that announces every second is unusable. The
            value is still readable on demand via the label. */}
        <p
          data-tabular
          aria-label={`Elapsed time ${format(elapsed)}`}
          className="font-heading text-2xl font-bold tracking-wider text-ink"
        >
          {format(elapsed)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? "Pause timer" : "Resume timer"}
          >
            {running ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setRunning(false);
              setElapsed(0);
            }}
          >
            <Square />
            Stop &amp; log
          </Button>
        </div>
      </div>
    </aside>
  );
}
