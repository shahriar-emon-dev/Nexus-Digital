"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  addAnnotation,
  resolveAnnotation,
  setDeliverableStatus,
  type Annotation,
  type VersionRow,
} from "@/lib/supabase/deliverable-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Review surface: pins on the artwork, and the decision.
 *
 * Every interaction here writes to the database. The version this replaces held
 * annotations in component state over a hardcoded array, so a comment vanished
 * on the next render and "Approve" did nothing at all — its own TODO said so.
 *
 * Pin coordinates are stored as fractions of the image, so a pin lands in the
 * same place at any render size.
 */
export function ReviewCanvas({
  deliverableId,
  version,
  versions,
  annotations,
  status,
}: {
  deliverableId: string;
  version: VersionRow | null;
  versions: VersionRow[];
  annotations: Annotation[];
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<{ x: number; y: number } | null>(null);
  const [body, setBody] = React.useState("");

  useRealtime(
    "client:deliverables",
    [{ table: "deliverable_annotations" }, { table: "deliverables" }],
    () => router.refresh()
  );

  function onCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setDraft({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    });
    setBody("");
  }

  function submitPin() {
    if (!version || !draft || !body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addAnnotation(version.id, draft.x, draft.y, body);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDraft(null);
      setBody("");
      router.refresh();
    });
  }

  function decide(next: "Approved" | "Changes requested") {
    setError(null);
    startTransition(async () => {
      const result = await setDeliverableStatus(deliverableId, next);
      if ("error" in result) setError(result.error);
      router.refresh();
    });
  }

  if (!version) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
        <p className="max-w-sm text-ink-tertiary">
          Nothing has been submitted for review yet. The first version will appear here.
        </p>
      </div>
    );
  }

  const open = annotations.filter((a) => !a.resolved);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-8 lg:flex-row lg:px-8">
      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {versions.map((v) => (
            <Badge key={v.id} variant={v.id === version.id ? "brand" : "outline"} size="sm">
              {v.label}
            </Badge>
          ))}
        </div>

        <div
          onClick={onCanvasClick}
          className="relative min-h-80 flex-1 cursor-crosshair overflow-hidden rounded-2xl border border-line bg-surface-sunken"
        >
          {version.media_url ? (
            <Image
              src={version.media_url}
              alt={version.alt ?? ""}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-contain"
            />
          ) : (
            <p className="absolute inset-0 grid place-items-center p-6 text-center text-ink-tertiary">
              This version has no preview image. Comments still attach to it.
            </p>
          )}

          {annotations.map((a, i) => (
            <span
              key={a.id}
              style={{ left: `${Number(a.x) * 100}%`, top: `${Number(a.y) * 100}%` }}
              className={cn(
                "absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[0.625rem] font-bold",
                a.resolved ? "bg-success text-canvas" : "bg-brand text-brand-fg"
              )}
            >
              {i + 1}
            </span>
          ))}

          {draft && (
            <span
              style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}
              className="absolute size-6 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-brand motion-reduce:animate-none"
              aria-hidden
            />
          )}
        </div>

        <p className="text-[0.75rem] text-ink-tertiary">
          Click anywhere on the artwork to leave a comment at that point.
        </p>
      </div>

      {/* ── Comments and decision ───────────────────────────────────────── */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
        {error && (
          <p role="alert" className="text-[0.875rem] text-danger">
            {error}
          </p>
        )}

        {draft && (
          <Card variant="glass" className="gap-3 rounded-xl p-4">
            <label htmlFor="pin-body" className="text-[0.8125rem] font-medium text-ink">
              Comment at this point
            </label>
            <textarea
              id="pin-body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="resize-y rounded-lg border border-line bg-surface px-3 py-2 text-[0.875rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            />
            <div className="flex gap-2">
              <Button size="sm" className="rounded-lg" disabled={pending} onClick={submitPin}>
                {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => setDraft(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          <h2 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink">
            <MessageSquare className="size-4" aria-hidden />
            {open.length} open of {annotations.length}
          </h2>

          {annotations.map((a, i) => (
            <Card
              key={a.id}
              variant="glass"
              className={cn("gap-2 rounded-xl p-3", a.resolved && "opacity-60")}
            >
              <p className="flex items-center gap-2 text-[0.75rem] text-ink-tertiary">
                <span className="grid size-5 place-items-center rounded-full bg-brand/15 text-[0.625rem] font-bold text-brand">
                  {i + 1}
                </span>
                {a.authorName}
              </p>
              <p className="text-[0.875rem] text-ink-secondary">{a.body}</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-fit rounded-lg"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await resolveAnnotation(a.id, !a.resolved);
                    router.refresh();
                  })
                }
              >
                <Check />
                {a.resolved ? "Reopen" : "Resolve"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <p className="text-[0.75rem] text-ink-tertiary">
            Current status: <span className="font-medium text-ink">{status}</span>
          </p>
          <Button
            className="rounded-xl"
            disabled={pending || status === "Approved"}
            onClick={() => decide("Approved")}
          >
            Approve this version
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={pending || status === "Changes requested"}
            onClick={() => decide("Changes requested")}
          >
            Request changes
          </Button>
        </div>
      </aside>
    </div>
  );
}
