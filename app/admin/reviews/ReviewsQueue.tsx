"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  MessageSquareQuote,
  Search,
  Star,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  deleteReview,
  setReviewFeatured,
  setReviewStatus,
  setReviewStatusBulk,
  type ReviewStatus,
  type ReviewWithContext,
} from "@/lib/supabase/review-actions";
import { cn } from "@/lib/utils";

const statusTone: Record<ReviewStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

/** Stars read as a rating to a screen reader too, not just as five glyphs. */
function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            "size-3.5",
            n <= value ? "fill-warning text-warning" : "text-line-strong"
          )}
        />
      ))}
    </span>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function ReviewsQueue({ initial }: { initial: ReviewWithContext[] }) {
  const router = useRouter();
  const toast = useToast();

  const [reviews, setReviews] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("pending");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  React.useEffect(() => setReviews(initial), [initial]);

  /** A review submitted from the public site lands in this queue immediately. */
  useRealtime("admin:reviews", [{ table: "reviews" }], () => router.refresh());

  // Counts come from the same array the list renders, so the tiles cannot
  // disagree with what is on screen.
  const stats = React.useMemo(() => {
    const approved = reviews.filter((r) => r.status === "approved");
    return {
      pending: reviews.filter((r) => r.status === "pending").length,
      approved: approved.length,
      rejected: reviews.filter((r) => r.status === "rejected").length,
      average: approved.length
        ? (approved.reduce((n, r) => n + r.rating, 0) / approved.length).toFixed(1)
        : null,
    };
  }, [reviews]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.author_name.toLowerCase().includes(q) ||
        (r.author_company ?? "").toLowerCase().includes(q) ||
        (r.title ?? "").toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q)
      );
    });
  }, [reviews, query, status]);

  // A selection that survives a filter change would act on rows the moderator
  // can no longer see, so it is pruned to what is actually visible.
  React.useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(visible.map((r) => r.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visible]);

  async function moderate(review: ReviewWithContext, next: ReviewStatus) {
    setPending(review.id);
    setError(null);
    const previous = reviews;
    setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, status: next } : r)));

    const result = await setReviewStatus(review.id, next);
    setPending(null);
    if ("error" in result) {
      setReviews(previous);
      setError(result.error);
      return;
    }
    toast.add({
      title:
        next === "approved"
          ? "Published to the public wall"
          : next === "rejected"
            ? "Rejected"
            : "Returned to the queue",
      type: next === "rejected" ? "warning" : "success",
    });
    router.refresh();
  }

  async function bulk(next: ReviewStatus) {
    const ids = [...selected];
    setError(null);
    const result = await setReviewStatusBulk(ids, next);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSelected(new Set());
    toast.add({ title: `${result.data.count} reviews ${next}`, type: "success" });
    router.refresh();
  }

  async function feature(review: ReviewWithContext) {
    const next = !review.is_featured;
    setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, is_featured: next } : r)));
    const result = await setReviewFeatured(review.id, next);
    if ("error" in result) {
      setError(result.error);
      router.refresh();
      return;
    }
    router.refresh();
  }

  async function remove(review: ReviewWithContext) {
    const previous = reviews;
    setReviews((rs) => rs.filter((r) => r.id !== review.id));
    const result = await deleteReview(review.id);
    if ("error" in result) {
      setReviews(previous);
      setError(result.error);
      return;
    }
    toast.add({ title: "Review deleted", type: "info" });
    router.refresh();
  }

  const allVisibleSelected = visible.length > 0 && selected.size === visible.length;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting review" value={String(stats.pending)} icon={MessageSquareQuote} />
        <StatCard label="Published" value={String(stats.approved)} />
        <StatCard label="Rejected" value={String(stats.rejected)} />
        {/* No average until something is approved — an empty wall has no score. */}
        <StatCard
          label="Average rating"
          value={stats.average ?? "—"}
          caption={stats.average ? "Across published reviews" : "Nothing published yet"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search author, company or text…"
            aria-label="Search reviews"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Awaiting review</SelectItem>
            <SelectItem value="approved">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-ink-tertiary" aria-live="polite">
          {visible.length} of {reviews.length}
        </span>
      </div>

      {selected.size > 0 && (
        <Card className="border-brand-line bg-brand-subtle/30">
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={(c) =>
                setSelected(c ? new Set(visible.map((r) => r.id)) : new Set())
              }
              aria-label="Select all visible reviews"
            />
            <span className="text-sm font-medium text-ink">{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" onClick={() => bulk("approved")}>
                <Check />
                Publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulk("rejected")}>
                <X />
                Reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title={
            reviews.length === 0
              ? "No reviews yet"
              : status === "pending"
                ? "Queue is clear"
                : "No matches"
          }
          description={
            reviews.length === 0
              ? "Reviews submitted from the public site arrive here for moderation before anything is published."
              : status === "pending"
                ? "Every review has been moderated. New submissions appear here without a reload."
                : "No review matches that search and filter."
          }
          action={
            reviews.length > 0 && status !== "all" ? (
              <Button variant="outline" size="sm" onClick={() => setStatus("all")}>
                Show all reviews
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => {
            const busy = pending === r.id;
            const isSelected = selected.has(r.id);
            return (
              <li key={r.id}>
                <Card className={cn("transition-opacity", busy && "opacity-60")}>
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(c) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (c) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          })
                        }
                        aria-label={`Select review by ${r.author_name}`}
                        className="mt-1"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{r.author_name}</span>
                          {r.author_role && (
                            <span className="text-sm text-ink-tertiary">
                              {r.author_role}
                              {r.author_company ? ` · ${r.author_company}` : ""}
                            </span>
                          )}
                          <Rating value={r.rating} />
                          <Badge variant={statusTone[r.status]} size="sm">
                            {r.status === "pending"
                              ? "Awaiting review"
                              : r.status === "approved"
                                ? "Published"
                                : "Rejected"}
                          </Badge>
                          {r.is_featured && (
                            <Badge variant="brand" size="sm">
                              <Star aria-hidden />
                              Featured
                            </Badge>
                          )}
                        </div>

                        {r.title && (
                          <p className="mt-2 font-heading text-base font-semibold text-ink">
                            {r.title}
                          </p>
                        )}
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{r.body}</p>

                        <p className="mt-3 text-xs text-ink-tertiary">
                          Submitted {dateFmt.format(new Date(r.created_at))}
                          {r.projects ? ` · ${r.projects.name}` : ""}
                          {r.organizations ? ` · ${r.organizations.name}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 border-t border-line-subtle pt-3">
                      {r.status !== "approved" && (
                        <Button size="sm" disabled={busy} onClick={() => moderate(r, "approved")}>
                          <Check />
                          Publish
                        </Button>
                      )}
                      {r.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => moderate(r, "rejected")}
                        >
                          <X />
                          Reject
                        </Button>
                      )}
                      {r.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => moderate(r, "pending")}
                        >
                          <Undo2 />
                          Return to queue
                        </Button>
                      )}
                      {r.status === "approved" && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => feature(r)}>
                          <Star />
                          {r.is_featured ? "Unfeature" : "Feature"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        disabled={busy}
                        onClick={() => remove(r)}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
