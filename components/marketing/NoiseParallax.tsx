"use client";

import * as React from "react";

/**
 * Film grain that drifts very slightly with the pointer.
 *
 * Two fixes over the source: the write is coalesced into a rAF instead of
 * running on every `mousemove`, and the layer is inset *past* the viewport
 * edges. The original translated a `inset: 0` overlay by up to 10px, which
 * dragged its own edge into view and left an unfiltered strip on two sides.
 */
export function NoiseParallax({ strength = 10 }: { strength?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !still);
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
      node.style.transform = `translate3d(${pending.x * strength}px, ${
        pending.y * strength
      }px, 0)`;
      pending = null;
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
    <div
      ref={ref}
      aria-hidden
      className="noise-field"
      style={{ inset: `-${strength * 2}px` }}
    />
  );
}
