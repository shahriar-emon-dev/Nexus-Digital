import type { Metadata } from "next";

import { listProjectOptions } from "@/lib/supabase/project-queries";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Leave a review" };

/** Was a placeholder, while the reviews table and moderation queue already existed. */
export default async function NewReviewPage() {
  const projects = await listProjectOptions();

  return (
    <>
      <DashboardHeader
        title="Leave a review"
        description="Tell us how the work went. Reviews are read before anything is published."
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Leave a review" }]}
      />

      <div className="mx-auto w-full max-w-2xl px-5 py-6 lg:px-8">
        <ReviewForm projects={projects} />
      </div>
    </>
  );
}
