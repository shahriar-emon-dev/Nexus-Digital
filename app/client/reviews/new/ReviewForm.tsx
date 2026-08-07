"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { submitReview } from "@/lib/supabase/review-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Leaving a review.
 *
 * Submitted reviews are held for moderation — the insert policy pins the status
 * to pending, so nothing a client writes reaches the public site until somebody
 * approves it. The confirmation says so rather than implying it is live.
 */
export function ReviewForm({ projects }: { projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [rating, setRating] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0) {
      setError("Choose a rating from 1 to 5.");
      return;
    }
    const form = new FormData(event.currentTarget);
    form.set("rating", String(rating));
    setError(null);
    startTransition(async () => {
      const result = await submitReview(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <Card variant="glass" className="items-center gap-3 rounded-2xl p-10 text-center">
        <Star className="size-8 text-brand" aria-hidden />
        <h2 className="font-heading text-xl font-semibold text-ink">Thank you</h2>
        <p className="max-w-sm text-ink-tertiary">
          Your review has been sent to the team. It will appear publicly only after someone has
          read and approved it.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="gap-5 rounded-2xl p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {error && (
          <p role="alert" className="text-[0.875rem] text-danger">
            {error}
          </p>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="text-[0.8125rem] font-medium text-ink">Rating</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} out of 5`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
                className="rounded-md p-1 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    value <= rating ? "fill-brand text-brand" : "text-line-strong"
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="authorName" className="text-[0.8125rem] font-medium text-ink">
            Your name
          </label>
          <Input id="authorName" name="authorName" required minLength={2} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="authorRole" className="text-[0.8125rem] font-medium text-ink">
            Your role (optional)
          </label>
          <Input id="authorRole" name="authorRole" />
        </div>

        {projects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="projectId" className="text-[0.8125rem] font-medium text-ink">
              Which project?
            </label>
            <select
              id="projectId"
              name="projectId"
              className="h-11 rounded-lg border border-line bg-surface px-3 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            >
              <option value="">Not about a specific project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="body" className="text-[0.8125rem] font-medium text-ink">
            Your review
          </label>
          <textarea
            id="body"
            name="body"
            rows={5}
            required
            minLength={10}
            className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          />
        </div>

        <Button type="submit" className="w-fit rounded-xl" disabled={pending}>
          {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
          Submit review
        </Button>
      </form>
    </Card>
  );
}
