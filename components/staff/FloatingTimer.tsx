"use client";

import * as React from "react";
import { Maximize2, Minimize2, Pause, Play, Square } from "lucide-react";

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
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Collapsed: a pill small enough to sit beside content rather than over it.
  // The source drew this control but never wired it to anything.
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label={`Expand time tracker. Elapsed ${format(elapsed)} on ${project}.`}
        className={cn(
          "glass fixed right-4 bottom-4 z-50 flex items-center gap-2.5 rounded-full py-2 pr-3 pl-3.5 shadow-e3",
          "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
          "hover:-translate-y-0.5 hover:border-brand-line",
          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        )}
      >
        <span className="relative flex size-2" aria-hidden>
          {running && (
            <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-70 motion-reduce:animate-none" />
          )}
          <span
            className={cn("relative size-2 rounded-full", running ? "bg-brand" : "bg-ink-tertiary")}
          />
        </span>
        <span data-tabular className="font-heading text-sm font-bold tracking-wider text-ink">
          {format(elapsed)}
        </span>
        <Maximize2 className="size-3.5 text-ink-tertiary" aria-hidden />
      </button>
    );
  }

  return (
    <aside
      aria-label="Active time tracker"
      className={cn(
        // Below `sm` a 18rem card covers most of a phone screen and sits on top
        // of the page content, so it collapses to a single-row bar instead.
        "glass fixed inset-x-4 bottom-4 z-50 rounded-xl p-3 shadow-e4",
        "sm:inset-x-auto sm:right-4 sm:w-72 sm:p-4",
        "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
        "hover:-translate-y-0.5 hover:border-brand-line"
      )}
    >
      <div className="flex items-center gap-3 sm:block">
        <div className="flex shrink-0 items-center gap-2 sm:mb-4 sm:justify-between">
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
            <span className="hidden text-[0.625rem] font-semibold tracking-wider text-brand uppercase sm:inline">
              {running ? "Active timer" : "Paused"}
            </span>
          </p>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Collapse timer"
            onClick={() => setCollapsed(true)}
            className="hidden sm:inline-flex"
          >
            <Minimize2 />
          </Button>
        </div>

        <div className="min-w-0 flex-1 sm:mb-4">
          <p className="truncate text-sm font-medium text-ink">{project}</p>
          <p className="hidden truncate text-xs text-ink-tertiary sm:block">{task}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:justify-between">
          {/* No aria-live: a counter that announces every second is unusable.
              The value stays readable on demand through the label. */}
          <p
            data-tabular
            aria-label={`Elapsed time ${format(elapsed)}`}
            className="font-heading text-base font-bold tracking-wider text-ink sm:text-2xl"
          >
            {format(elapsed)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="sm:size-9.5"
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
              <span className="hidden sm:inline">Stop &amp; log</span>
              <span className="sr-only sm:hidden">Stop and log</span>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
