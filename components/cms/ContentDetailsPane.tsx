"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Newspaper } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  saveContentDetails,
  type ContentDetails,
} from "@/lib/supabase/content-details-actions";

/**
 * Editorial metadata for a post or case study.
 *
 * These fields drive the index cards, the ordering and the article header:
 * excerpt, category, cover image, read time, publish date, author. None of them
 * had a write path — `content_details` was select-only in the whole codebase —
 * so they could be set by a migration and never again.
 *
 * A missing row is called out rather than rendered as a silently empty form,
 * because a published post with no details is a live page missing its summary
 * and date, and an editor should see that as something to fix.
 */
export function ContentDetailsPane({
  pageId,
  details,
  authors,
  isPublished,
}: {
  pageId: string;
  details: ContentDetails | null;
  authors: { id: string; name: string }[];
  isPublished: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await saveContentDetails(pageId, form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({ title: "Details saved", type: "success" });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold tracking-wide text-ink uppercase">
          <Newspaper className="size-4 text-brand" aria-hidden />
          Article details
        </h3>

        {details === null && isPublished && (
          <Alert tone="warning">
            <AlertDescription>
              This post is live with no details set, so it shows no summary,
              category or date and sorts last.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert tone="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cd-excerpt" className="text-xs font-medium text-ink">
              Excerpt
            </label>
            <textarea
              id="cd-excerpt"
              name="excerpt"
              rows={3}
              maxLength={400}
              defaultValue={details?.excerpt ?? ""}
              placeholder="The one or two sentences that appear on the index card."
              className="resize-y rounded-lg border border-line bg-surface px-3 py-2 text-[0.875rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cd-category" className="text-xs font-medium text-ink">
              Category
            </label>
            <Input
              id="cd-category"
              name="category"
              defaultValue={details?.category ?? ""}
              placeholder="Engineering, Growth Strategy…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cd-cover" className="text-xs font-medium text-ink">
              Cover image URL
            </label>
            <Input
              id="cd-cover"
              name="coverUrl"
              type="url"
              defaultValue={details?.coverUrl ?? ""}
              placeholder="https://…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cd-date" className="text-xs font-medium text-ink">
                Published on
              </label>
              {/* Drives the index sort. Undated posts fall to the bottom. */}
              <Input
                id="cd-date"
                name="publishedOn"
                type="date"
                defaultValue={details?.publishedOn ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cd-read" className="text-xs font-medium text-ink">
                Read time (min)
              </label>
              <Input
                id="cd-read"
                name="readMinutes"
                type="number"
                min={0}
                max={600}
                defaultValue={details?.readMinutes ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cd-author" className="text-xs font-medium text-ink">
              Author
            </label>
            <Select name="authorId" defaultValue={details?.authorId ?? ""}>
              <SelectTrigger id="cd-author" size="sm">
                <SelectValue placeholder="Unattributed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unattributed</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2.5 text-[0.8125rem] text-ink-secondary">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={details?.isFeatured ?? false}
              className="size-4 rounded border-line accent-[var(--brand)]"
            />
            Feature on the index
          </label>

          <Button type="submit" size="sm" disabled={pending} className="w-fit">
            {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Save details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
