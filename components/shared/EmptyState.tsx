import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shown when a list is legitimately empty — never for a loading or error state.
 * Always offers the next action, so an empty screen is never a dead end.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-sunken/50 text-center",
        compact ? "gap-2 px-6 py-10" : "gap-3 px-8 py-16",
        className
      )}
    >
      {Icon && (
        <span className="relative mb-1 grid size-12 place-items-center rounded-2xl border border-line bg-surface text-ink-tertiary shadow-e1">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <h3 className="font-heading text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-ink-tertiary">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
