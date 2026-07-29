"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Pointer-tracking highlight for glass cards.
 *
 * The Stitch source wrote `--mouse-x` / `--mouse-y` onto each card but never
 * declared a rule that read them, so the effect never rendered. This finishes
 * the job: the same two properties drive a radial wash that fades in on hover.
 *
 * Writes are coalesced into one rAF, and the layer is skipped entirely for
 * coarse pointers — there is no cursor to follow on a touchscreen.
 */
export function Spotlight({
  children,
  className,
  radius = 320,
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    setEnabled(window.matchMedia("(pointer: fine)").matches);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    let pending: { x: number; y: number } | null = null;
    let frame = 0;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      node.style.setProperty("--mouse-x", `${pending.x}px`);
      node.style.setProperty("--mouse-y", `${pending.y}px`);
      pending = null;
    };

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      pending = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return (
    <div ref={ref} className={cn("group/spotlight relative", className)}>
      {enabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-(--duration-slow) group-hover/spotlight:opacity-100"
          style={{
            background: `radial-gradient(${radius}px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), color-mix(in oklch, var(--brand) 14%, transparent), transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
