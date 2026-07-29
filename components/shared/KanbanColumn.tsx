"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type KanbanColumnData = {
  id: string;
  title: string;
  /** Optional WIP limit — the header turns to a warning once exceeded. */
  wipLimit?: number;
  accent?: "brand" | "info" | "warning" | "danger" | "neutral";
};

const accents = {
  brand: "bg-brand",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-line-strong",
} as const;

export function KanbanColumn({
  column,
  count,
  children,
  isDropTarget = false,
  onAddCard,
  ...dropHandlers
}: {
  column: KanbanColumnData;
  count: number;
  children: React.ReactNode;
  isDropTarget?: boolean;
  onAddCard?: () => void;
} & Pick<
  React.ComponentProps<"section">,
  "onDragOver" | "onDrop" | "onDragEnter" | "onDragLeave"
>) {
  const overLimit = column.wipLimit != null && count > column.wipLimit;

  return (
    <section
      aria-label={`${column.title}, ${count} cards`}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl border bg-surface-sunken/60",
        "transition-[border-color,background-color] duration-(--duration-fast)",
        isDropTarget ? "border-brand bg-brand-subtle/40" : "border-line"
      )}
      {...dropHandlers}
    >
      <header className="flex items-center gap-2 px-3.5 py-3">
        <span
          className={cn("size-2 shrink-0 rounded-full", accents[column.accent ?? "neutral"])}
          aria-hidden
        />
        <h3 className="text-[0.8125rem] font-semibold text-ink">{column.title}</h3>
        <Badge
          variant={overLimit ? "warning" : "default"}
          size="sm"
          className="ml-1"
          data-tabular
        >
          {count}
          {column.wipLimit != null && `/${column.wipLimit}`}
        </Badge>
        {overLimit && <span className="sr-only">Work-in-progress limit exceeded</span>}
        {onAddCard && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto"
            onClick={onAddCard}
            aria-label={`Add a card to ${column.title}`}
          >
            <Plus />
          </Button>
        )}
      </header>

      <div className="flex min-h-24 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-3 scrollbar-none">
        {children}
      </div>
    </section>
  );
}
