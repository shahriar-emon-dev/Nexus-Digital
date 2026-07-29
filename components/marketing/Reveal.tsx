"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll-in reveal. The Stitch source added the hidden state from JavaScript
 * *after* paint, which flashes the content before hiding it — and leaves it
 * invisible forever if the script fails. Here the element starts visible and is
 * only hidden once we know an observer is running, so a JS failure degrades to
 * "no animation" rather than "no content".
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [armed, setArmed] = React.useState(false);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    setArmed(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal={armed && !shown ? "pending" : "shown"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-(--duration-deliberate) ease-(--ease-out-expo) motion-reduce:transition-none",
        armed && !shown && "translate-y-8 opacity-0",
        className
      )}
    >
      {children}
    </Tag>
  );
}
