"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/supabase/marketing-actions";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";

/**
 * Rotating client quotes.
 *
 * Rebuilt rather than ported: the source rewrote `innerHTML` on a timer, which
 * throws away the DOM (and any focus in it) every six seconds and re-parses
 * markup built from string concatenation. This swaps React state and holds on a
 * static quote for reduced-motion users.
 */
export function QuoteRotator({
  quotes,
  intervalMs = 6000,
}: {
  /**
   * Published testimonials. Empty renders nothing at all — the quotes this
   * replaces were invented, attributed to named people at clients that do not
   * exist ("Marcus Sterling, CEO, Astra Banking"), on the sign-in screen.
   */
  quotes: Testimonial[];
  intervalMs?: number;
}) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 500);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, quotes.length]);

  const quote = quotes[index];
  // Nothing published means nothing to show. A rotator with no quotes rendered
  // an empty blockquote and a blank avatar before this guard.
  if (!quote) return null;

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
          <AvatarFallback>{initials(quote.author_name)}</AvatarFallback>
        </Avatar>
        <span>
          <span className="block text-[0.8125rem] font-semibold text-brand">{quote.author_name}</span>
          <span className="block text-sm text-ink-tertiary">
            {[quote.author_role, quote.organizationName].filter(Boolean).join(", ")}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
