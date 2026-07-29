import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap",
    "rounded-full border font-medium",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  ],
  {
    variants: {
      variant: {
        default: "border-line bg-surface-sunken text-ink-secondary",
        brand: "border-brand-line bg-brand-subtle text-brand-subtle-fg",
        ion: "border-transparent bg-ion-subtle text-ion-subtle-fg",
        outline: "border-line-strong bg-transparent text-ink-secondary",
        solid: "border-transparent bg-brand text-brand-fg",
        // Status variants always ship with an icon + label in use — never colour alone.
        success: "border-success-line bg-success-subtle text-success",
        warning: "border-warning-line bg-warning-subtle text-warning",
        danger: "border-danger-line bg-danger-subtle text-danger",
        info: "border-info-line bg-info-subtle text-info",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[0.6875rem]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-[0.8125rem]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/** A status dot. Never used alone — it always sits beside a text label. */
function StatusDot({
  tone = "success",
  pulse = false,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  pulse?: boolean;
}) {
  const tones = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    neutral: "bg-ink-tertiary",
  } as const;
  return (
    <span
      aria-hidden
      data-slot="status-dot"
      className={cn("relative inline-flex size-2 shrink-0", className)}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:animate-none",
            tones[tone]
          )}
        />
      )}
      <span className={cn("relative size-2 rounded-full", tones[tone])} />
    </span>
  );
}

export { Badge, StatusDot, badgeVariants };
