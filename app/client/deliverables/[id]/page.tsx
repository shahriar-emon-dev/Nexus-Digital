import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { clientAccount, portalProjects } from "@/lib/client-portal";
import { currentVersion, deliverableById, deliverables } from "@/lib/deliverables";
import { leadership } from "@/lib/team";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ReviewCanvas } from "./ReviewCanvas";

type Params = { params: { id: string } };

export function generateStaticParams() {
  return deliverables.map((d) => ({ id: d.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const deliverable = deliverableById(params.id);
  return { title: deliverable ? deliverable.title : "Deliverable not found" };
}

const stamp = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function DeliverableReviewPage({ params }: Params) {
  const deliverable = deliverableById(params.id);
  if (!deliverable) notFound();

  const project = portalProjects.find((p) => p.id === deliverable.projectId);
  const owner = leadership.find((m) => m.id === deliverable.ownerId);
  const latest = currentVersion(deliverable);

  return (
    // Same one-viewport treatment as the messages hub: the canvas and the
    // annotation stream scroll inside themselves so the toolbar stays put.
    <div className="flex min-h-0 flex-1 flex-col lg:h-svh lg:flex-none lg:overflow-hidden">
      <DashboardHeader
        title={deliverable.title}
        titleAs="p"
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Projects", href: "/client/projects" },
          ...(project ? [{ label: project.name, href: project.href }] : []),
          { label: "Review" },
        ]}
      />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-4 pt-5 pb-4 lg:px-6">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl leading-tight font-bold tracking-tight text-ink">
            {deliverable.title}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
            {latest.summary} · Updated{" "}
            <time dateTime={deliverable.updatedAt} data-tabular>
              {stamp.format(new Date(deliverable.updatedAt))} UTC
            </time>
            {owner && ` by ${owner.name}`}
          </p>
        </div>

        {project && (
          <Button variant="outline" size="sm" render={<Link href={project.href} />}>
            <ArrowLeft />
            Back to {project.name}
          </Button>
        )}
      </div>

      <ReviewCanvas deliverable={deliverable} clientName={clientAccount.name} />
    </div>
  );
}
