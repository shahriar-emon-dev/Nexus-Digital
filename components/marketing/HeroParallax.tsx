"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll parallax for the hero copy.
 *
 * The source bound a bare `scroll` listener that wrote layout styles on every
 * event and applied the transform to the `<h1>` alone — which slides the
 * headline out from under its own paragraph. This moves the whole copy block as
 * one, coalesces writes into a rAF, and is inert under reduced-motion.
 */
export function HeroParallax({
  children,
  className,
  speed = 0.2,
  fadeOver = 600,
}: {
  children: React.ReactNode;
  className?: string;
  /** Fraction of scroll distance the block travels. */
  speed?: number;
  /** Scroll distance, in px, over which the block fades out completely. */
  fadeOver?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const y = window.scrollY;
      node.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      node.style.opacity = String(Math.max(0, 1 - y / fadeOver));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed, fadeOver]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
