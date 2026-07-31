"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Before/after comparison slider.
 *
 * Two fixes over the source. It only moves while you are actually dragging —
 * the original tracked bare `mousemove` over the container, so the panel
 * swung around whenever the pointer merely crossed it and there was no way to
 * park it. And it is operable from the keyboard: the handle is a real
 * `role="slider"` with arrow/Home/End support, where the source offered a
 * pointer-only `<div>`.
 */
export function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Legacy System",
  afterLabel = "Nexus Refactor",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [percent, setPercent] = React.useState(50);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);

  const setFromPointer = React.useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPercent(Math.max(0, Math.min(100, next)));
  }, []);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      setFromPointer(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setFromPointer]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") setPercent((p) => Math.max(0, p - step));
    else if (e.key === "ArrowRight") setPercent((p) => Math.min(100, p + step));
    else if (e.key === "Home") setPercent(0);
    else if (e.key === "End") setPercent(100);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        dragging.current = true;
        setFromPointer(e.clientX);
      }}
      className="glass relative aspect-21/9 w-full touch-none overflow-hidden rounded-2xl select-none"
    >
      {/* Before */}
      <div className="absolute inset-0">
        <Image src={before} alt={beforeLabel} fill sizes="100vw" className="object-cover" />
        <span className="glass absolute top-8 left-8 rounded-full px-4 py-2 text-[0.8125rem] font-semibold tracking-wider text-ink-secondary uppercase">
          {beforeLabel}
        </span>
      </div>

      {/* After — clipped to the handle position. `inset-y-0 left-0` with a width
          keeps the image itself un-scaled so the two halves stay registered. */}
      <div
        className="absolute inset-y-0 left-0 z-10 overflow-hidden border-r-2 border-brand shadow-[10px_0_30px_var(--brand-glow)]"
        style={{ width: `${percent}%` }}
      >
        <div
          className="relative h-full"
          style={{ width: containerRef.current?.offsetWidth ?? "100%" }}
        >
          <Image src={after} alt={afterLabel} fill sizes="100vw" className="object-cover" />
          <span className="glass absolute top-8 left-8 rounded-full px-4 py-2 text-[0.8125rem] font-semibold tracking-wider text-brand uppercase">
            {afterLabel}
          </span>
        </div>
      </div>

      {/* Handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Reveal the rebuilt platform"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${Math.round(percent)}% rebuilt platform shown`}
        onKeyDown={onKeyDown}
        className={cn(
          "absolute inset-y-0 z-20 w-1 cursor-ew-resize bg-brand",
          "focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
        )}
        style={{ left: `${percent}%` }}
      >
        <span className="glass absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-brand shadow-e3">
          <ChevronsLeftRight className="size-5 text-brand" aria-hidden />
        </span>
      </div>
    </div>
  );
}
