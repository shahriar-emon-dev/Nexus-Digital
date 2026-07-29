"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { KanbanCard, type KanbanCardData } from "./KanbanCard";
import { KanbanColumn, type KanbanColumnData } from "./KanbanColumn";

export type KanbanState = Record<string, KanbanCardData[]>;

/**
 * Board with native HTML5 drag-and-drop — no drag library, so nothing here has
 * to be kept in sync with one. Native DnD is pointer-only, so every card also
 * accepts Ctrl/Cmd + ArrowLeft/Right to move between columns; both paths go
 * through the same `move()` so behaviour cannot drift.
 */
export function KanbanBoard({
  columns,
  initialCards,
  onChange,
  onAddCard,
  className,
}: {
  columns: KanbanColumnData[];
  initialCards: KanbanState;
  onChange?: (next: KanbanState) => void;
  onAddCard?: (columnId: string) => void;
  className?: string;
}) {
  const [cards, setCards] = React.useState<KanbanState>(initialCards);
  const [dragging, setDragging] = React.useState<{ cardId: string; from: string } | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");

  const move = React.useCallback(
    (cardId: string, from: string, to: string) => {
      if (from === to) return;
      setCards((prev) => {
        const card = prev[from]?.find((c) => c.id === cardId);
        if (!card) return prev;
        const next = {
          ...prev,
          [from]: prev[from].filter((c) => c.id !== cardId),
          [to]: [card, ...(prev[to] ?? [])],
        };
        onChange?.(next);
        return next;
      });
      const toTitle = columns.find((c) => c.id === to)?.title ?? to;
      setAnnouncement(`Card moved to ${toTitle}.`);
    },
    [columns, onChange]
  );

  const moveByOffset = (cardId: string, from: string, offset: -1 | 1) => {
    const i = columns.findIndex((c) => c.id === from);
    const target = columns[i + offset];
    if (target) move(cardId, from, target.id);
  };

  return (
    <>
      <div
        className={cn("flex gap-4 overflow-x-auto pb-2", className)}
        role="application"
        aria-label="Project board"
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            count={cards[column.id]?.length ?? 0}
            isDropTarget={dropTarget === column.id}
            onAddCard={onAddCard ? () => onAddCard(column.id) : undefined}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDragEnter={() => setDropTarget(column.id)}
            onDragLeave={(e) => {
              // Ignore bubbling from children — only clear when the pointer
              // actually leaves the column box.
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDropTarget((t) => (t === column.id ? null : t));
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDropTarget(null);
              const cardId = e.dataTransfer.getData("text/card-id");
              const from = e.dataTransfer.getData("text/from-column");
              if (cardId && from) move(cardId, from, column.id);
              setDragging(null);
            }}
          >
            {(cards[column.id] ?? []).map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                dragging={dragging?.cardId === card.id}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/card-id", card.id);
                  e.dataTransfer.setData("text/from-column", column.id);
                  setDragging({ cardId: card.id, from: column.id });
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setDropTarget(null);
                }}
                onKeyboardMove={(dir) => moveByOffset(card.id, column.id, dir)}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>

      {/* Drag results are invisible to screen readers without this. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
