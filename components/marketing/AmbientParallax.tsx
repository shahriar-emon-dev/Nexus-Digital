"use client";

import * as React from "react";

/**
 * The two ambient glows behind the page, drifting slightly with the pointer.
 *
 * The source reached for its glows with `document.querySelector('.bg-primary\\/10')`
 * — a Tailwind utility class used as a hook, which breaks the moment the opacity
 * is tweaked. These are refs. Writes are also batched into a rAF instead of
 * running on every `mousemove`, and the whole effect is skipped for coarse
 * pointers and reduced-motion users.
 */
export function AmbientParallax({ strength = 50 }: { strength?: number }) {
  const one = React.useRef<HTMLSpanElement>(null);
  const two = React.useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !still);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    let pending: { x: number; y: number } | null = null;
    let frame = 0;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      const { x, y } = pending;
      pending = null;
      if (one.current)
        one.current.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
      if (two.current)
        two.current.style.transform = `translate3d(${-x * strength}px, ${-y * strength}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, strength]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <span
        ref={one}
        className="absolute -top-[10%] -left-[10%] size-[40vw] rounded-full bg-brand/10 blur-[120px] will-change-transform"
      />
      <span
        ref={two}
        className="absolute -right-[10%] -bottom-[10%] size-[40vw] rounded-full bg-chart-3/10 blur-[120px] will-change-transform"
      />
    </div>
  );
}
