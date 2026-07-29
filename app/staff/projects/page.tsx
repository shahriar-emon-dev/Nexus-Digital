import { Filter, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BoardClient } from "./BoardClient";

export default function StaffBoardPage() {
  return (
    <>
      <DashboardHeader
        title="Northwind — Site rebuild"
        description="Sprint 14 · 6 days remaining. Drag a card, or press Ctrl with the arrow keys to move it."
        breadcrumbs={[
          { label: "Staff", href: "/staff" },
          { label: "Boards", href: "/staff/projects" },
          { label: "Site rebuild" },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter />
              Filter
            </Button>
            <Button size="sm">
              <Plus />
              New card
            </Button>
          </>
        }
      />

      <div className="min-w-0 px-5 py-6 lg:px-8">
        <BoardClient />
      </div>
    </>
  );
}
