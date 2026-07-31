"use client";

import * as React from "react";
import { CheckCircle2, MessageSquarePlus, Reply, SquarePen } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  annotationsFor,
  deliverableStatusTone,
  openAnnotations,
  type Annotation,
  type Deliverable,
} from "@/lib/deliverables";
import { leadership } from "@/lib/team";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function authorName(id: Annotation["authorId"], clientName: string) {
  if (id === "client") return clientName;
  return leadership.find((m) => m.id === id)?.name ?? "Unknown";
}

/**
 * Deliverable review workspace.
 *
 * Pins are positioned from fractional coordinates, so a comment stays on the
 * element it refers to at any render size — the source used fixed percentages
 * baked into class names, which is the same idea but unmaintainable.
 *
 * Each pin is a real button wired to the matching entry in the stream, so the
 * annotation is reachable by keyboard. The source relied on `group-hover` to
 * reveal comment text, which is invisible to touch and keyboard users.
 */
export function ReviewCanvas({
  deliverable,
  clientName,
}: {
  deliverable: Deliverable;
  clientName: string;
}) {
  const [versionId, setVersionId] = React.useState(
    deliverable.versions[deliverable.versions.length - 1].id
  );
  const [selected, setSelected] = React.useState<string | null>(null);
  const [decision, setDecision] = React.useState<"approved" | "changes" | null>(null);

  const version = deliverable.versions.find((v) => v.id === versionId)!;
  const pins = annotationsFor(versionId);
  const open = openAnnotations(versionId);
  const isCurrent = versionId === deliverable.versions[deliverable.versions.length - 1].id;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-3 lg:px-6">
        <div
          role="group"
          aria-label="Version"
          className="flex items-center gap-1 rounded-full border border-line bg-surface-sunken p-1"
        >
          {deliverable.versions.map((v, i) => {
            const latest = i === deliverable.versions.length - 1;
            const active = v.id === versionId;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setVersionId(v.id);
                  setSelected(null);
                }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[0.75rem] font-semibold whitespace-nowrap",
                  "transition-colors duration-(--duration-fast)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  active
                    ? "bg-brand text-brand-fg"
                    : "text-ink-tertiary hover:bg-surface hover:text-ink"
                )}
              >
                {v.label}
                {latest && <span className="ml-1.5 opacity-70">current</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={deliverableStatusTone[deliverable.status]}>
            {deliverable.status}
          </Badge>
          <Button
            variant="outline"
            disabled={!isCurrent}
            onClick={() => setDecision("changes")}
          >
            <SquarePen />
            Request changes
          </Button>
          <Button
            disabled={!isCurrent}
            onClick={() => setDecision("approved")}
            className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
          >
            <CheckCircle2 />
            Approve
          </Button>
        </div>
      </div>

      {!isCurrent && (
        <p className="border-b border-line bg-surface-sunken px-4 py-2 text-[0.8125rem] text-ink-tertiary lg:px-6">
          Viewing {version.label}, released{" "}
          <time dateTime={version.releasedOn}>
            {day.format(new Date(version.releasedOn))}
          </time>
          . Only the current version can be approved.
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        {/* ── Canvas ────────────────────────────────────────────────────── */}
        <section
          aria-label="Deliverable"
          className="scrollbar-none flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-auto bg-canvas p-4 lg:p-10"
        >
          <div className="relative w-full max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={version.image}
              alt={version.alt}
              className="w-full rounded-xl border border-line shadow-e4"
            />

            {pins.map((pin, i) => {
              const active = selected === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => setSelected(active ? null : pin.id)}
                  aria-pressed={active}
                  aria-label={`Annotation ${i + 1} by ${authorName(pin.authorId, clientName)}${
                    pin.resolved ? ", resolved" : ""
                  }`}
                  style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                  className={cn(
                    "absolute z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center",
                    "rounded-full border-2 text-[0.6875rem] font-bold",
                    "transition-transform duration-(--duration-normal) ease-(--ease-out-quint)",
                    "hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                    pin.resolved
                      ? "border-canvas bg-success text-canvas"
                      : "border-canvas bg-brand text-brand-fg",
                    // Only unresolved pins on the live version pulse for attention.
                    !pin.resolved &&
                      !active &&
                      "animate-pulse-ring motion-reduce:animate-none",
                    active && "scale-110 ring-2 ring-brand ring-offset-2 ring-offset-canvas"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Annotation stream ─────────────────────────────────────────── */}
        <aside
          aria-label="Annotations"
          className="flex min-h-0 shrink-0 flex-col border-line xl:w-96 xl:border-l"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-[0.8125rem] font-semibold tracking-widest text-ink-tertiary uppercase">
              Annotations
            </h2>
            <Badge variant={open.length > 0 ? "warning" : "success"} size="sm">
              <span data-tabular>{open.length}</span> open
            </Badge>
          </div>

          {decision && (
            <div className="border-b border-line p-4">
              <Alert tone="warning">
                <AlertTitle>
                  {decision === "approved" ? "Approval" : "Change request"} not recorded
                </AlertTitle>
                <AlertDescription>
                  {/* TODO: POST to /api/client once the deliverables mutation lands. */}
                  This is queued in the browser only. Nothing is written to the
                  project record until the deliverables API is connected.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <ul className="scrollbar-none flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            {pins.map((pin, i) => {
              const active = selected === pin.id;
              const name = authorName(pin.authorId, clientName);
              const mine = pin.authorId === "client";
              return (
                <li key={pin.id}>
                  <Card
                    variant="glass"
                    className={cn(
                      "gap-3 rounded-xl border-l-2 p-4",
                      "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
                      "hover:-translate-y-0.5",
                      active
                        ? "border-l-brand ring-1 ring-brand-line"
                        : pin.resolved
                          ? "border-l-success opacity-70"
                          : "border-l-line-strong"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(active ? null : pin.id)}
                      className="flex items-center justify-between gap-3 rounded text-left focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full text-[0.625rem] font-bold",
                            pin.resolved
                              ? "bg-success-subtle text-success"
                              : "bg-brand-subtle text-brand"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[0.8125rem] font-semibold",
                            mine ? "text-brand" : "text-ink"
                          )}
                        >
                          {name}
                        </span>
                      </span>
                      <time
                        dateTime={pin.at}
                        className="shrink-0 text-[0.6875rem] text-ink-tertiary"
                      >
                        {time.format(new Date(pin.at))}
                      </time>
                    </button>

                    <p className="text-[0.875rem] leading-relaxed text-ink-secondary">
                      {pin.body}
                    </p>

                    <div className="flex items-center justify-between gap-3 border-t border-line-subtle pt-3">
                      {pin.resolved ? (
                        <span className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-success">
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          Resolved
                        </span>
                      ) : (
                        <span className="text-[0.6875rem] text-ink-tertiary">
                          {pin.replies === 0 ? (
                            "No replies"
                          ) : (
                            <>
                              <span data-tabular>{pin.replies}</span>{" "}
                              {pin.replies === 1 ? "reply" : "replies"}
                            </>
                          )}
                        </span>
                      )}
                      <Button variant="ghost" size="sm" disabled>
                        <Reply />
                        Reply
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}

            {pins.length === 0 && (
              <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[0.8125rem] text-ink-tertiary">
                No annotations on {version.label}.
              </p>
            )}
          </ul>

          <div className="border-t border-line p-4">
            {/* TODO: enable once annotations can be written back. */}
            <Button variant="outline" className="w-full" disabled>
              <MessageSquarePlus />
              Add annotation
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
