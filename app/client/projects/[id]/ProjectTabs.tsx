"use client";

import Link from "next/link";
import { FolderOpen, KanbanSquare, ReceiptText, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilestoneRoadmap } from "@/components/client/MilestoneRoadmap";
import type { BoardTask, ProjectMilestone } from "@/lib/client-portal";
import { ReviewBoard } from "@/components/client/ReviewBoard";

/**
 * The four project views from the design.
 *
 * Real tabs rather than the source's inert `<button>` strip — Base UI wires up
 * roving focus, arrow-key navigation and the `aria-controls` pairing, so the
 * panels are reachable without a pointer. The strip scrolls horizontally on
 * narrow screens instead of wrapping into two rows.
 */
export function ProjectTabs({
  projectId,
  milestones,
  tasks,
}: {
  projectId: string;
  milestones: ProjectMilestone[];
  tasks: BoardTask[];
}) {
  return (
    <Tabs defaultValue="roadmap">
      <TabsList variant="underline" className="scrollbar-none overflow-x-auto">
        <TabsTrigger value="roadmap">
          <Route aria-hidden />
          Milestone Roadmap
        </TabsTrigger>
        <TabsTrigger value="board">
          <KanbanSquare aria-hidden />
          Kanban Progress Board
        </TabsTrigger>
        <TabsTrigger value="files">
          <FolderOpen aria-hidden />
          Deliverables &amp; Files
        </TabsTrigger>
        <TabsTrigger value="invoices">
          <ReceiptText aria-hidden />
          Project Invoices
        </TabsTrigger>
      </TabsList>

      <TabsContent value="roadmap" className="mt-10">
        <MilestoneRoadmap milestones={milestones} />
      </TabsContent>

      <TabsContent value="board" className="mt-10">
        <ReviewBoard projectId={projectId} tasks={tasks} />
      </TabsContent>

      {/* No design was supplied for these two, so they say so plainly and point
          at the surface that already owns the data rather than showing an
          invented table. */}
      <TabsContent value="files" className="mt-10">
        <Pending
          icon={FolderOpen}
          title="Deliverables & Files"
          body="Approved assets, source files and handover packages will land here."
        />
      </TabsContent>

      <TabsContent value="invoices" className="mt-10">
        <Pending
          icon={ReceiptText}
          title="Project Invoices"
          body="Invoices for this project are billed through your account."
          action={{ label: "Open Invoices", href: "/client/invoices" }}
        />
      </TabsContent>
    </Tabs>
  );
}

function Pending({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof FolderOpen;
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line-strong px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-line bg-surface-sunken">
        <Icon className="size-6 text-ink-tertiary" aria-hidden />
      </span>
      <div>
        <h3 className="font-heading text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-1 max-w-sm text-ink-tertiary">{body}</p>
      </div>
      {action && (
        <Button variant="outline" size="sm" render={<Link href={action.href} />}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
