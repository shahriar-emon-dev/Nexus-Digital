"use client";

import * as React from "react";
import { CalendarDays, GripVertical, MessageSquare, Paperclip } from "lucide-react";

import { cn } from "@/lib/utils";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export type Priority = "low" | "medium" | "high" | "urgent";

export type KanbanCardData = {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  assignees?: { name: string; src?: string }[];
  dueDate?: string;
  overdue?: boolean;
  comments?: number;
  attachments?: number;
  checklist?: { done: number; total: number };
};

/** Priority is conveyed by an explicit text label, not by the rail colour alone. */
const priorityMeta: Record<Priority, { rail: string; badge: React.ComponentProps<typeof Badge>["variant"] }> = {
  low: { rail: "bg-line-strong", badge: "default" },
  medium: { rail: "bg-info", badge: "info" },
  high: { rail: "bg-warning", badge: "warning" },
  urgent: { rail: "bg-danger", badge: "danger" },
};

export function KanbanCard({
  card,
  onDragStart,
  onDragEnd,
  dragging = false,
  onKeyboardMove,
  className,
}: {
  card: KanbanCardData;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  dragging?: boolean;
  /** Keyboard escape hatch — native HTML5 drag is mouse-only. */
  onKeyboardMove?: (direction: -1 | 1) => void;
  className?: string;
}) {
  const meta = card.priority ? priorityMeta[card.priority] : null;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      tabIndex={0}
      onKeyDown={(e) => {
        if (!onKeyboardMove) return;
        if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onKeyboardMove(1);
        }
        if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onKeyboardMove(-1);
        }
      }}
      aria-roledescription="Draggable card. Press Ctrl with the left or right arrow key to move it between columns."
      className={cn(
        "group/card relative flex cursor-grab flex-col gap-2.5 overflow-hidden rounded-xl",
        "border border-line bg-surface p-3.5 pl-4 shadow-e1",
        "transition-[border-color,box-shadow,transform,opacity] duration-(--duration-fast) ease-(--ease-out-quint)",
        "hover:-translate-y-0.5 hover:border-brand-line hover:shadow-e3",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
        "active:cursor-grabbing",
        dragging && "rotate-1 opacity-40",
        className
      )}
    >
      {meta && <span className={cn("absolute inset-y-0 left-0 w-1", meta.rail)} aria-hidden />}

      <div className="flex items-start gap-2">
        <h4 className="flex-1 text-sm leading-snug font-medium text-ink">{card.title}</h4>
        <GripVertical
          className="mt-0.5 size-3.5 shrink-0 text-ink-tertiary opacity-0 transition-opacity group-hover/card:opacity-100"
          aria-hidden
        />
      </div>

      {card.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-tertiary">
          {card.description}
        </p>
      )}

      {(card.labels?.length || card.priority) && (
        <div className="flex flex-wrap gap-1.5">
          {card.priority && (
            <Badge variant={meta!.badge} size="sm" className="capitalize">
              {card.priority}
            </Badge>
          )}
          {card.labels?.map((l) => (
            <Badge key={l} variant="outline" size="sm">
              {l}
            </Badge>
          ))}
        </div>
      )}

      {card.checklist && card.checklist.total > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-(--duration-slow) ease-(--ease-out-expo)"
              style={{ width: `${(card.checklist.done / card.checklist.total) * 100}%` }}
            />
          </div>
          <span data-tabular className="text-[0.6875rem] text-ink-tertiary">
            {card.checklist.done}/{card.checklist.total}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-0.5 text-[0.6875rem] text-ink-tertiary">
        {card.dueDate && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              card.overdue && "font-medium text-danger"
            )}
          >
            <CalendarDays className="size-3" aria-hidden />
            {card.overdue && <span className="sr-only">Overdue: </span>}
            {card.dueDate}
          </span>
        )}
        {!!card.comments && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden />
            <span data-tabular>{card.comments}</span>
            <span className="sr-only">comments</span>
          </span>
        )}
        {!!card.attachments && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="size-3" aria-hidden />
            <span data-tabular>{card.attachments}</span>
            <span className="sr-only">attachments</span>
          </span>
        )}
        {card.assignees && card.assignees.length > 0 && (
          <AvatarGroup people={card.assignees} size="xs" max={3} className="ml-auto" />
        )}
      </div>
    </article>
  );
}
