"use client";

import * as React from "react";

const SIZE = 256;

/**
 * Ambient glow that trails the cursor and warms up over interactive cards.
 *
 * The source wrote `style.transform` straight from the `mousemove` handler,
 * forcing a style recalc on every event. This coalesces into a rAF and moves
 * the layer with a translate on the compositor. It renders nothing for coarse
 * pointers or reduced-motion users — there is no cursor to follow on a
 * touchscreen, and a light that chases you is exactly the kind of motion the
 * setting exists to suppress.
 */
export function CursorGlow() {
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
      node.style.transform = `translate3d(${pending.x - SIZE / 2}px, ${
        pending.y - SIZE / 2
      }px, 0)`;
      pending = null;
    };

    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    // Intensity change on card hover, delegated from the document so cards can
    // come and go (they do — the grid filters) without rebinding listeners.
    const onOver = (e: PointerEvent) => {
      const hot = (e.target as Element | null)?.closest?.("[data-glow-hot]");
      node.dataset.hot = hot ? "true" : "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      data-hot="false"
      className="pointer-events-none fixed top-0 left-0 -z-10 size-64 rounded-full bg-brand/10 blur-[120px] transition-colors duration-(--duration-slow) data-[hot=true]:bg-ion/20"
    />
  );
}
