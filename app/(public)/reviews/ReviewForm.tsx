"use client";

import * as React from "react";
import { Check, Loader2, Star } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { submitReview } from "@/lib/supabase/review-actions";
import { cn } from "@/lib/utils";

/**
 * Public submission form.
 *
 * It says plainly that a review is moderated before it appears. Telling
 * someone their review is live when it is queued is the kind of small lie that
 * generates a support ticket an hour later.
 */
export function ReviewForm() {
  const [rating, setRating] = React.useState(0);
  const [hovered, setHovered] = React.useState(0);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please choose a rating.");
      return;
    }

    setSending(true);
    const data = new FormData(e.currentTarget);
    data.set("rating", String(rating));
    const result = await submitReview(data);
    setSending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-success-subtle text-success">
            <Check className="size-6" aria-hidden />
          </span>
          <h3 className="font-heading text-xl font-semibold text-ink">Thank you</h3>
          <p className="max-w-sm text-sm text-ink-tertiary">
            Your review has been received. It appears on this page once a member
            of the team has read it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {error && (
            <Alert tone="danger" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-ink">Your rating</legend>
            <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  aria-pressed={rating === n}
                  className="rounded-md p-1 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                >
                  <Star
                    aria-hidden
                    className={cn(
                      "size-7 transition-colors",
                      n <= (hovered || rating)
                        ? "fill-warning text-warning"
                        : "text-line-strong"
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="authorName">Your name</Label>
              <Input id="authorName" name="authorName" required maxLength={120} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="authorCompany">Company</Label>
              <Input id="authorCompany" name="authorCompany" maxLength={120} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="authorRole">Role</Label>
              <Input id="authorRole" name="authorRole" maxLength={120} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Headline</Label>
              <Input id="title" name="title" maxLength={160} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Your review</Label>
            <Textarea id="body" name="body" rows={5} required minLength={10} maxLength={2000} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-tertiary">
              Reviews are read by the team before they appear here.
            </p>
            <Button type="submit" disabled={sending}>
              {sending ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
              {sending ? "Sending…" : "Submit review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
