"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { KanbanBoard, type KanbanState } from "@/components/shared/KanbanBoard";
import type { KanbanColumnData } from "@/components/shared/KanbanColumn";
import { useRealtime } from "@/lib/supabase/use-realtime";
import { moveTask } from "@/lib/supabase/task-actions";

/**
 * The staff project board.
 *
 * Both the columns and the cards used to be hardcoded here, so every staff
 * member saw the same eight invented tasks against clients that do not exist,
 * and dragging one changed nothing anywhere.
 *
 * Columns come from the `board_column` enum the tasks are stored against, so a
 * column can never exist that no task could be in. Cards come from the server;
 * a drop writes through `moveTask` and other people see it over realtime.
 */

const columns: KanbanColumnData[] = [
  { id: "backlog", title: "Backlog", accent: "neutral" },
  { id: "in-progress", title: "In progress", accent: "info" },
  { id: "review", title: "In review", accent: "warning" },
  { id: "done", title: "Done", accent: "brand" },
];

export function BoardClient({ initialCards }: { initialCards: KanbanState }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  // Somebody else moving a card updates this board without a reload.
  useRealtime("staff:board", [{ table: "project_tasks" }], () => router.refresh());

  // The board reports the whole next state after a drop. Rather than diff it,
  // each card is told which column it is now in — the action is idempotent, so
  // re-asserting a position that has not changed is a no-op.
  async function onChange(next: KanbanState) {
    setError(null);
    const moves: Promise<unknown>[] = [];

    for (const [columnId, cards] of Object.entries(next)) {
      cards.forEach((card, index) => {
        moves.push(moveTask(card.id, columnId, index));
      });
    }

    const results = await Promise.all(moves);
    const failed = results.find(
      (r): r is { error: string } => typeof r === "object" && r !== null && "error" in r
    );
    if (failed) {
      setError(failed.error);
      // Re-reads the server's version, so a refused move snaps back rather than
      // leaving the browser showing a change the database rejected.
      router.refresh();
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-4 text-[0.875rem] text-danger">
          {error}
        </p>
      )}
      <KanbanBoard columns={columns} initialCards={initialCards} onChange={onChange} />
    </>
  );
}
