import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { deliverableStatusTone } from "@/lib/portal-tones";
import { getDeliverable, listAnnotations } from "@/lib/supabase/deliverable-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ReviewCanvas } from "./ReviewCanvas";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const deliverable = await getDeliverable(params.id);
  return { title: deliverable ? deliverable.title : "Deliverable not found" };
}

/**
 * A deliverable under review. Was backed by lib/deliverables.ts — two invented
 * items whose annotations and approvals went nowhere.
 */
export default async function DeliverableReviewPage({ params }: Params) {
  const deliverable = await getDeliverable(params.id);
  if (!deliverable) notFound();

  // Newest first from the query, so the head of the list is the current one.
  const latest = deliverable.versions[0] ?? null;
  const annotations = latest ? await listAnnotations(latest.id) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-svh lg:flex-none lg:overflow-hidden">
      <DashboardHeader
        title={deliverable.title}
        titleAs="p"
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Projects", href: "/client/projects" },
          { label: deliverable.title },
        ]}
        actions={
          <Badge variant={deliverableStatusTone[deliverable.status]}>{deliverable.status}</Badge>
        }
      />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 pt-6 pb-4 lg:px-8">
        <div>
          <h1 className="font-heading text-[1.75rem] leading-tight font-bold text-ink">
            {deliverable.title}
          </h1>
          <p className="text-[0.875rem] text-ink-tertiary">
            {deliverable.projectName ?? "No project"}
            {deliverable.discipline && ` · ${deliverable.discipline}`}
            {deliverable.ownerName && ` · ${deliverable.ownerName}`}
          </p>
        </div>

        <Button variant="ghost" size="sm" render={<Link href="/client/projects" />}>
          <ArrowLeft />
          Back to projects
        </Button>
      </div>

      <ReviewCanvas
        deliverableId={deliverable.id}
        version={latest}
        versions={deliverable.versions}
        annotations={annotations}
        status={deliverable.status}
      />
    </div>
  );
}
