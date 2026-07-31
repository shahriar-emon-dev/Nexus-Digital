import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ShaderBackdrop } from "./ShaderBackdrop";

/**
 * Split auth frame: an ambient brand panel on the left, the form on the right.
 * Each auth route supplies its own `brand` content, since registration,
 * sign-in and verification each make a different promise.
 */
export function AuthShell({
  brand,
  children,
  className,
}: {
  brand: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex min-h-svh flex-col md:flex-row", className)}>
      <section className="relative flex min-h-100 w-full flex-col justify-between overflow-hidden border-r border-line p-4 md:min-h-svh md:w-[45%] md:p-10">
        <ShaderBackdrop className="absolute inset-0 z-0 size-full opacity-60" />
        <div className="noise-field absolute inset-0 z-1" aria-hidden />
        {brand}
      </section>

      {/* `overflow-x-clip` is load-bearing: pages decorate this pane with 16rem
          bloom spans offset past its edges, which push the document wider than
          the viewport on a phone. */}
      <section className="relative flex w-full items-center justify-center overflow-x-clip bg-surface-sunken p-4 md:w-[55%] md:p-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-xl">{children}</div>
      </section>
    </main>
  );
}

export function BrandMark({ sub }: { sub?: React.ReactNode }) {
  return (
    <div className="relative z-10 flex flex-wrap items-center gap-4">
      <Link
        href="/"
        className="font-heading text-[2rem] leading-none font-bold tracking-tight text-brand"
      >
        NEXUS
      </Link>
      {sub}
    </div>
  );
}
