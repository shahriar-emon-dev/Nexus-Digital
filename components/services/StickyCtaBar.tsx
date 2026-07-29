"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Floating conversion bar. Dismissible — it is fixed to the bottom of the
 * viewport, so at the end of a long page it parks on top of the site footer.
 * The source offered no way to move it.
 */
export function StickyCtaBar({
  price = "$12,000",
  availability = "Q4 Slots Open",
}: {
  price?: string;
  availability?: string;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:px-8 md:pb-8">
      <div className="glass glow-brand mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 rounded-2xl border-brand/30 p-4 md:flex-row md:p-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[0.625rem] tracking-widest text-ink-tertiary uppercase">
              Investment Tier
            </p>
            <p className="font-heading text-2xl font-semibold text-ink">
              Starting at <span className="text-brand">{price}</span>
            </p>
          </div>

          <span className="hidden h-10 w-px bg-line md:block" aria-hidden />

          <div className="hidden md:block">
            <p className="text-[0.625rem] tracking-widest text-ink-tertiary uppercase">
              Availability
            </p>
            <p className="flex items-center gap-2">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-70 motion-reduce:animate-none" />
                <span className="relative size-2 rounded-full bg-success" />
              </span>
              <span className="text-sm font-bold text-ink">{availability}</span>
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <Button
            size="xl"
            className="w-full rounded-xl md:w-auto"
            render={<Link href="/book-meeting" />}
          >
            Schedule Technical Discovery Call
            <ArrowRight />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss this offer"
            onClick={() => setDismissed(true)}
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
}
