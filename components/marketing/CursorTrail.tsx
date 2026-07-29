"use client";

import * as React from "react";

const POOL = 14;
const MIN_DISTANCE = 26; // px between spawns — the source fired on a coin flip

/**
 * Glowing cursor trail.
 *
 * The Stitch source created and destroyed a DOM node on ~5% of every mousemove
 * event, which garbage-churns badly on a long page. This keeps a fixed pool of
 * elements and recycles them, spawns on distance travelled rather than chance
 * so the trail is even at any pointer speed, and writes styles inside a single
 * rAF. It renders nothing at all for touch pointers or reduced-motion users.
 */
export function CursorTrail() {
  const layer = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !still);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const root = layer.current;
    if (!root) return;

    const dots = Array.from(root.children) as HTMLElement[];
    let next = 0;
    let lastX = 0;
    let lastY = 0;
    let pending: { x: number; y: number } | null = null;
    let frame = 0;

    const draw = () => {
      frame = 0;
      if (!pending) return;
      const { x, y } = pending;
      pending = null;

      const dot = dots[next];
      next = (next + 1) % dots.length;

      dot.style.transition = "none";
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
      dot.style.opacity = "0.9";

      requestAnimationFrame(() => {
        dot.style.transition = "opacity 600ms linear, transform 600ms ease-out";
        dot.style.transform = `translate3d(${x}px, ${y}px, 0) scale(2.4)`;
        dot.style.opacity = "0";
      });
    };

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) return;
      lastX = e.clientX;
      lastY = e.clientY;
      pending = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={layer}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-60 overflow-hidden"
    >
      {Array.from({ length: POOL }).map((_, i) => (
        <span
          key={i}
          className="absolute -top-0.5 -left-0.5 size-1 rounded-full bg-brand opacity-0 blur-[1.5px]"
          style={{ boxShadow: "0 0 10px var(--brand)", willChange: "transform, opacity" }}
        />
      ))}
    </div>
  );
}
