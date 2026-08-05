import type { Metadata } from "next";
import { MessageSquareQuote, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { listApprovedReviews } from "@/lib/supabase/review-actions";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = {
  title: "Reviews",
  description: "What clients say about working with Nexus, in their own words.",
};

// Database-backed, so a fully static page would freeze at build time. ISR keeps
// it cheap while letting a newly published review appear without a deploy.
export const revalidate = 60;

const dateFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn("size-4", n <= value ? "fill-warning text-warning" : "text-line-strong")}
        />
      ))}
    </span>
  );
}

export default async function ReviewsPage() {
  const reviews = await listApprovedReviews();

  // Derived from the rows on the page, so the headline figure can never
  // contradict the cards beneath it.
  const average =
    reviews.length > 0
      ? (reviews.reduce((n, r) => n + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-20 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] leading-[1.1] font-bold tracking-tight text-ink">
          Client reviews
        </h1>
        <p className="mt-4 text-lg text-ink-tertiary">
          Unedited, and published only after we have read them.
        </p>
        {average && (
          <div className="mt-6 flex items-center gap-3">
            <Stars value={Math.round(Number(average))} />
            <span className="text-sm text-ink-secondary">
              <strong className="text-ink">{average}</strong> average across{" "}
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
      </header>

      <section className="mt-12" aria-label="Published reviews">
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No reviews published yet"
            description="Be the first to write one — the form below goes straight to the team."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Stars value={r.rating} />
                      {r.is_featured && <Badge variant="brand" size="sm">Featured</Badge>}
                    </div>
                    {r.title && (
                      <p className="font-heading text-lg font-semibold text-ink">{r.title}</p>
                    )}
                    <blockquote className="flex-1 text-sm leading-relaxed text-ink-secondary">
                      {r.body}
                    </blockquote>
                    <footer className="border-t border-line-subtle pt-3 text-sm">
                      <span className="font-semibold text-ink">{r.author_name}</span>
                      {(r.author_role || r.author_company || r.organizations) && (
                        <span className="block text-xs text-ink-tertiary">
                          {[r.author_role, r.author_company ?? r.organizations?.name]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      <span className="mt-1 block text-xs text-ink-tertiary">
                        {dateFmt.format(new Date(r.created_at))}
                      </span>
                    </footer>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16" aria-label="Submit a review">
        <ReviewForm />
      </section>
    </div>
  );
}
