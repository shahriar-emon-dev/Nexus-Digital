import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-xl border p-4 text-sm",
  {
    variants: {
      tone: {
        neutral: "border-line bg-surface-sunken text-ink-secondary",
        success: "border-success-line bg-success-subtle text-ink-secondary",
        warning: "border-warning-line bg-warning-subtle text-ink-secondary",
        danger: "border-danger-line bg-danger-subtle text-ink-secondary",
        info: "border-info-line bg-info-subtle text-ink-secondary",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

const toneMeta = {
  neutral: { Icon: Info, cls: "text-ink-tertiary", label: "Note" },
  success: { Icon: CheckCircle2, cls: "text-success", label: "Success" },
  warning: { Icon: AlertTriangle, cls: "text-warning", label: "Warning" },
  danger: { Icon: XCircle, cls: "text-danger", label: "Error" },
  info: { Icon: Info, cls: "text-info", label: "Information" },
} as const;

/**
 * The tone is always announced by an icon and a visually-hidden label as well as
 * by colour, so the meaning survives colour-blindness and greyscale printing.
 */
function Alert({
  className,
  tone = "neutral",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const { Icon, cls, label } = toneMeta[tone ?? "neutral"];
  return (
    <div role="alert" className={cn(alertVariants({ tone, className }))} {...props}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", cls)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="sr-only">{label}:</span>
        {children}
      </div>
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("font-medium text-ink", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("leading-relaxed text-ink-tertiary", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
