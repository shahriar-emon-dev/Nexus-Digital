import type { Metadata } from "next";
import { Server } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotInstrumented } from "@/components/admin/NotInstrumented";

export const metadata: Metadata = { title: "Nodes" };

export default function AdminNodesPage() {
  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Nodes" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Nodes
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Health and capacity of every compute node.
        </p>
      </header>

      <NotInstrumented
        icon={Server}
        title="Compute health and capacity"
        summary="CPU, memory or instance health for the machines running this application."
        needs={[
          {
            label: "A metrics endpoint on the runtime",
            detail:
              "Node-level CPU and memory belong to the host, not the database. A serverless deployment has no fixed nodes to report at all — which is itself the honest answer for this stack today.",
          },
          {
            label: "A monitoring provider",
            detail:
              "Datadog, Grafana Cloud or the hosting platform's own metrics API. This screen would render their series rather than compute its own.",
          },
        ]}
        related={[
          {
            label: "Database size and cache behaviour",
            href: "/admin/database",
            detail: "The one layer this application can measure directly.",
          },
        ]}
      />
    </div>
  );
}
