import type { Metadata } from "next";

import { listReviewsForModeration } from "@/lib/supabase/review-actions";
import { ReviewsQueue } from "./ReviewsQueue";

export const metadata: Metadata = { title: "Review moderation" };

export default async function AdminReviewsPage() {
  const reviews = await listReviewsForModeration();

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-5 lg:p-10">
      <div>
        <h1 className="font-heading text-[2.5rem] leading-[1.2] font-bold tracking-tight text-ink">
          Review moderation
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Everything submitted from the public site arrives here first. Nothing
          reaches <code className="text-ink-secondary">/reviews</code> until it
          is published — and that gate is a database policy, not a filter on
          this screen.
        </p>
      </div>

      <ReviewsQueue initial={reviews} />
    </div>
  );
}
