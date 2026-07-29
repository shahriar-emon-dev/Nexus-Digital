import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The mark: two nodes joined by a link — the "nexus". Drawn rather than
 * imported so it inherits the brand tokens and stays crisp at any size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="nexus-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--ion)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#nexus-mark)" />
      <path
        d="M10 22V10l12 12V10"
        fill="none"
        stroke="var(--brand-fg)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  showWordmark = true,
  sub,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
        className
      )}
    >
      <LogoMark />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[0.9375rem] font-bold tracking-tight text-ink">
            Nexus
          </span>
          {sub && (
            <span className="mt-0.5 text-[0.625rem] font-medium tracking-[0.12em] text-ink-tertiary uppercase">
              {sub}
            </span>
          )}
        </span>
      )}
      <span className="sr-only">Nexus Digital Agency{sub ? ` — ${sub}` : ""}</span>
    </Link>
  );
}
