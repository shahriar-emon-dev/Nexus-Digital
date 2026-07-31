import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative flex flex-col rounded-2xl transition-[border-color,box-shadow,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
  {
    variants: {
      variant: {
        default: "border border-line bg-surface shadow-e1",
        raised: "border border-line bg-surface-raised shadow-e3",
        glass: "glass rounded-2xl shadow-e2",
        sunken: "border border-line-subtle bg-surface-sunken",
        ghost: "border border-transparent",
      },
      interactive: {
        true: "cursor-pointer hover:-translate-y-0.5 hover:border-brand-line hover:shadow-e3",
        false: "",
      },
      /**
       * Hover lift without the pointer cursor — for panels that respond to the
       * cursor but are not themselves a single click target.
       */
      lift: {
        true: "hover:-translate-y-0.5 hover:border-brand-line hover:shadow-[0_0_30px_var(--brand-glow)]",
        false: "",
      },
    },
    defaultVariants: { variant: "default", interactive: false, lift: false },
  }
);

function Card({
  className,
  variant,
  interactive,
  lift,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn("edge-lit", cardVariants({ variant, interactive, lift, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 p-5 pb-0", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("font-heading text-base leading-tight font-semibold text-ink", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-ink-tertiary", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("absolute top-5 right-5 flex items-center gap-1", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-5", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-auto flex items-center gap-3 border-t border-line-subtle px-5 py-3.5",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  cardVariants,
};
