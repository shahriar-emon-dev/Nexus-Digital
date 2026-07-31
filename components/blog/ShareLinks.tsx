"use client";

import * as React from "react";
import { Check, Link2, Linkedin, Twitter } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Share controls.
 *
 * The source rendered `<button>`s that did nothing at all. LinkedIn and X are
 * real links that open the share intent in a new tab; "Copy link" writes to the
 * clipboard and confirms in an `aria-live` region rather than only changing an
 * icon.
 */
export function ShareLinks({ title }: { title: string }) {
  const [copied, setCopied] = React.useState(false);
  const [url, setUrl] = React.useState("");

  // Read on the client — the canonical URL is not known during SSR.
  React.useEffect(() => setUrl(window.location.href), []);

  const targets = [
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: "X / Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
  ];

  const rowClass = cn(
    "group flex w-full items-center gap-4 rounded-xl border border-line p-3",
    "transition-colors duration-(--duration-fast) hover:bg-surface-sunken",
    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
  );
  const iconClass =
    "grid size-8 shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-secondary";
  const labelClass =
    "text-sm font-medium text-ink-tertiary transition-colors group-hover:text-ink";

  return (
    <div>
      <h2 className="mb-6 text-xs font-semibold tracking-[0.2em] text-ink-tertiary uppercase">
        Share Insight
      </h2>
      <div className="flex flex-col gap-3">
        {targets.map((target) => (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            className={rowClass}
          >
            <span className={iconClass}>
              <target.icon className="size-4" aria-hidden />
            </span>
            <span className={labelClass}>{target.label}</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ))}

        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url || window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={rowClass}
        >
          <span className={iconClass}>
            {copied ? (
              <Check className="size-4 text-success" aria-hidden />
            ) : (
              <Link2 className="size-4" aria-hidden />
            )}
          </span>
          <span className={labelClass}>{copied ? "Link copied" : "Copy link"}</span>
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard." : ""}
      </p>
    </div>
  );
}
