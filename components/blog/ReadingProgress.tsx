"use client";

import * as React from "react";

/**
 * Reading progress bar.
 *
 * The source assigned `window.onscroll = …`, which replaces any handler another
 * component has registered — on a page with a sticky header and a table of
 * contents that is a real collision. This uses `addEventListener`, batches into
 * a rAF, and drives a compositor-only `scaleX` rather than animating `width`.
 */
export function ReadingProgress() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-100 h-1 bg-surface-sunken"
      role="progressbar"
      aria-label="Reading progress"
      aria-hidden
    >
      <div
        ref={ref}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-brand to-ion"
      />
    </div>
  );
}
