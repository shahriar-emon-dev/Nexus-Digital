"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { authTestimonials } from "@/lib/testimonials";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";

/**
 * Rotating client quotes.
 *
 * Rebuilt rather than ported: the source rewrote `innerHTML` on a timer, which
 * throws away the DOM (and any focus in it) every six seconds and re-parses
 * markup built from string concatenation. This swaps React state and holds on a
 * static quote for reduced-motion users.
 */
export function QuoteRotator({ intervalMs = 6000 }: { intervalMs?: number }) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % authTestimonials.length);
        setVisible(true);
      }, 500);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const quote = authTestimonials[index];

  return (
    <figure
      className={cn(
        "relative z-10 flex max-w-md flex-col gap-6 transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <blockquote className="font-heading text-[2.5rem] leading-tight font-bold text-balance text-ink">
        &ldquo;{quote.quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-4">
        <Avatar size="lg" className="border border-brand/30">
          <AvatarFallback>{initials(quote.name)}</AvatarFallback>
        </Avatar>
        <span>
          <span className="block text-[0.8125rem] font-semibold text-brand">{quote.name}</span>
          <span className="block text-sm text-ink-tertiary">{quote.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}
