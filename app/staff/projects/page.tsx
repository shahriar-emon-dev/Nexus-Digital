import type { Metadata } from "next";

import { getStaffBoard } from "@/lib/supabase/staff-workspace";
import type { KanbanState } from "@/components/shared/KanbanBoard";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BoardClient } from "./BoardClient";

export const metadata: Metadata = { title: "Board" };

/**
 * The board across every project the caller can see.
 *
 * The header used to be hardcoded to "Northwind — Site rebuild · Sprint 14 · 6
 * days remaining", which named a client that does not exist and a sprint
 * nothing tracks. It now describes what is actually on the board.
 */
export default async function StaffBoardPage() {
  const grouped = await getStaffBoard();

  const initialCards: KanbanState = Object.fromEntries(
    Object.entries(grouped).map(([columnId, cards]) => [
      columnId,
      cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description ?? undefined,
        priority: card.priority ? ("urgent" as const) : undefined,
        // The project is the useful label here — it is what tells someone whose
        // work a card is when the board spans several engagements.
        labels: [card.projectName, card.discipline].filter(
          (l): l is string => Boolean(l)
        ),
        assignees: card.assigneeName ? [{ name: card.assigneeName }] : undefined,
      })),
    ])
  );

  const total = Object.values(grouped).reduce((sum, cards) => sum + cards.length, 0);
  const projects = new Set(
    Object.values(grouped)
      .flat()
      .map((c) => c.projectName)
      .filter(Boolean)
  );

  return (
    <>
      <DashboardHeader
        title="Board"
        description={
          total === 0
            ? "No tasks yet. Cards appear here as work is created on a project."
            : `${total} ${total === 1 ? "task" : "tasks"} across ${projects.size} ${
                projects.size === 1 ? "project" : "projects"
              }. Drag a card, or press Ctrl with the arrow keys to move it.`
        }
        breadcrumbs={[
          { label: "Staff", href: "/staff" },
          { label: "Board" },
        ]}
      />

      <div className="min-w-0 px-5 py-6 lg:px-8">
        <BoardClient initialCards={initialCards} />
      </div>
    </>
  );
}
