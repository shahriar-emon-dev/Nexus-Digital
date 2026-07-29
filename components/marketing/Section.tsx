import * as React from "react";

import { cn } from "@/lib/utils";

/** Consistent vertical rhythm and max width for every marketing band. */
export function Section({
  className,
  children,
  bleed = false,
  ...props
}: React.ComponentProps<"section"> & { bleed?: boolean }) {
  return (
    <section className={cn("relative py-20 lg:py-28", className)} {...props}>
      <div className={cn("mx-auto w-full px-5 lg:px-8", bleed ? "max-w-none" : "max-w-7xl")}>
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  overline,
  title,
  description,
  align = "left",
  className,
}: {
  overline?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "mx-auto max-w-2xl text-center",
        className
      )}
    >
      {overline && (
        <p className="text-overline font-semibold tracking-(--text-overline--letter-spacing) text-brand uppercase">
          {overline}
        </p>
      )}
      <h2 className="font-heading text-h2 font-semibold text-ink">{title}</h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-ink-tertiary",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
