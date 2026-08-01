"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CloudOff,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  History,
  Loader2,
  Plus,
  Rocket,
  Trash2,
  Undo2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  publishPage,
  restoreVersion,
  saveDraft,
  unpublishPage,
  type PageBlock,
  type PageDraft,
} from "@/lib/supabase/page-actions";
import { cn } from "@/lib/utils";

/**
 * The page builder.
 *
 * Every edit mutates a local draft and is debounced to the database, so work
 * survives a refresh. Publishing is a separate, explicit action — the live site
 * does not change until it is pressed, which is why Save and Publish are
 * visually distinct and never adjacent.
 */

const BLOCK_CATALOGUE: { kind: PageBlock["kind"]; name: string; required?: boolean }[] = [
  { kind: "hero", name: "Hero section", required: true },
  { kind: "featureGrid", name: "Feature grid" },
  { kind: "pricing", name: "Pricing tables" },
  { kind: "faq", name: "FAQ section" },
  { kind: "richText", name: "Rich text" },
  { kind: "testimonials", name: "Testimonials" },
  { kind: "cta", name: "Closing call to action" },
];

/** Which fields each block kind exposes. Drives the editor with no per-kind UI. */
const FIELDS: Record<PageBlock["kind"], { key: string; label: string; long?: boolean }[]> = {
  hero: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "heading", label: "Heading" },
    { key: "body", label: "Body", long: true },
    { key: "ctaLabel", label: "Button label" },
    { key: "ctaHref", label: "Button URL" },
    { key: "imageUrl", label: "Image URL" },
    { key: "imageAlt", label: "Image alt text" },
  ],
  featureGrid: [{ key: "heading", label: "Heading" }],
  pricing: [{ key: "heading", label: "Heading" }],
  faq: [{ key: "heading", label: "Heading" }],
  richText: [
    { key: "heading", label: "Heading" },
    { key: "body", label: "Body", long: true },
  ],
  testimonials: [{ key: "heading", label: "Heading" }],
  cta: [
    { key: "heading", label: "Heading" },
    { key: "body", label: "Body", long: true },
    { key: "ctaLabel", label: "Button label" },
    { key: "ctaHref", label: "Button URL" },
  ],
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "failed";

export function PageEditor({ draft }: { draft: PageDraft }) {
  const router = useRouter();
  const toast = useToast();

  const [blocks, setBlocks] = React.useState<PageBlock[]>(draft.blocks);
  const [state, setState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(draft.blocks[0]?.id ?? null);

  // The last value written, so autosave never fires for an unchanged tree.
  const lastSaved = React.useRef(JSON.stringify(draft.blocks));
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = React.useCallback(
    async (next: PageBlock[]) => {
      setState("saving");
      const result = await saveDraft(draft.versionId, next);
      if ("error" in result) {
        setState("failed");
        setError(result.error);
        return;
      }
      lastSaved.current = JSON.stringify(next);
      setState("saved");
      setError(null);
    },
    [draft.versionId]
  );

  /** Debounced autosave. Only writes when the tree actually differs. */
  React.useEffect(() => {
    if (JSON.stringify(blocks) === lastSaved.current) return;
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(blocks), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [blocks, persist]);

  /** Last line of defence against losing work on an accidental close. */
  React.useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(blocks) !== lastSaved.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [blocks]);

  const current = blocks.find((b) => b.id === selected) ?? null;

  function patch(id: string, key: string, value: string) {
    setBlocks((bs) =>
      bs.map((b) => (b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b))
    );
  }

  function add(kind: PageBlock["kind"]) {
    const block: PageBlock = {
      id: crypto.randomUUID(),
      kind,
      variant: "Default",
      visible: true,
      data: {},
    };
    setBlocks((bs) => [...bs, block]);
    setSelected(block.id);
  }

  function duplicate(block: PageBlock) {
    const copy: PageBlock = { ...block, id: crypto.randomUUID(), data: { ...block.data } };
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === block.id);
      return [...bs.slice(0, i + 1), copy, ...bs.slice(i + 1)];
    });
    setSelected(copy.id);
  }

  function move(id: string, delta: number) {
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function remove(block: PageBlock) {
    // A page without a hero has no entry point, so the last one cannot go.
    if (BLOCK_CATALOGUE.find((c) => c.kind === block.kind)?.required) {
      if (blocks.filter((b) => b.kind === block.kind).length === 1) {
        setError("A page needs at least one hero section.");
        return;
      }
    }
    setBlocks((bs) => bs.filter((b) => b.id !== block.id));
    if (selected === block.id) setSelected(null);
  }

  async function publishNow() {
    setBusy(true);
    setError(null);
    // Flush any pending edit first, or the publish would freeze stale content.
    if (JSON.stringify(blocks) !== lastSaved.current) await persist(blocks);

    const result = await publishPage(draft.page.id, draft.page.slug);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: "Published",
      description: `Live at /${draft.page.slug}`,
      type: "success",
    });
    router.refresh();
  }

  async function unpublishNow() {
    setBusy(true);
    const result = await unpublishPage(draft.page.id, draft.page.slug);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Unpublished", description: "The public URL now 404s.", type: "info" });
    router.refresh();
  }

  async function restore(versionId: string) {
    setBusy(true);
    const result = await restoreVersion(versionId, draft.versionId);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: "Version restored into the draft",
      description: "Nothing is live until you publish.",
      type: "success",
    });
    router.refresh();
  }

  const live = draft.page.status === "published";

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* -------------------------------------------------- status bar --- */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={live ? "success" : "warning"}>{draft.page.status}</Badge>
          <code className="font-mono text-sm text-ink-secondary">/{draft.page.slug}</code>
          <SaveIndicator state={state} onRetry={() => void persist(blocks)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {live && (
            <Button variant="ghost" size="sm" render={<Link href={`/${draft.page.slug}`} target="_blank" />}>
              <ExternalLink />
              View live
              <span className="sr-only"> (opens in a new tab)</span>
            </Button>
          )}
          {live && (
            <Button variant="outline" size="sm" disabled={busy} onClick={unpublishNow}>
              <EyeOff />
              Unpublish
            </Button>
          )}
          {/* Publish is separated and coloured so it can never be mistaken for
              a save. Saving is automatic; publishing is a decision. */}
          <Button size="sm" disabled={busy} onClick={publishNow}>
            {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Rocket />}
            {live ? "Publish changes" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        {/* ------------------------------------------------ block list --- */}
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="p-3">
              <ul className="flex flex-col gap-1">
                {blocks.map((b, i) => (
                  <li key={b.id}>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors",
                        selected === b.id ? "border-brand bg-brand-subtle" : "border-transparent"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(b.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium text-ink">
                          {BLOCK_CATALOGUE.find((c) => c.kind === b.kind)?.name ?? b.kind}
                        </span>
                        <span className="block truncate text-xs text-ink-tertiary">
                          {String(b.data.heading ?? "No heading")}
                        </span>
                      </button>
                      <span className="flex shrink-0 items-center">
                        <IconBtn label="Move up" onClick={() => move(b.id, -1)} disabled={i === 0}>
                          <ArrowUp />
                        </IconBtn>
                        <IconBtn
                          label="Move down"
                          onClick={() => move(b.id, 1)}
                          disabled={i === blocks.length - 1}
                        >
                          <ArrowDown />
                        </IconBtn>
                        <IconBtn
                          label={b.visible ? "Hide" : "Show"}
                          onClick={() =>
                            setBlocks((bs) =>
                              bs.map((x) => (x.id === b.id ? { ...x, visible: !x.visible } : x))
                            )
                          }
                        >
                          {b.visible ? <Eye /> : <EyeOff />}
                        </IconBtn>
                        <IconBtn label="Duplicate" onClick={() => duplicate(b)}>
                          <Copy />
                        </IconBtn>
                        <IconBtn label="Delete" onClick={() => remove(b)} danger>
                          <Trash2 />
                        </IconBtn>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-line-subtle pt-3">
                <Select value="" onValueChange={(v) => v && add(v as PageBlock["kind"])}>
                  <SelectTrigger size="sm" aria-label="Add a block">
                    <SelectValue placeholder="Add a block…" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCK_CATALOGUE.map((c) => (
                      <SelectItem key={c.kind} value={c.kind}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {draft.history.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
                  <History className="size-3.5" aria-hidden />
                  Revision history
                </p>
                <ul className="flex flex-col gap-1">
                  {draft.history.slice(0, 8).map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink-secondary">
                        v{v.version_number} ·{" "}
                        {new Date(v.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={busy}
                        onClick={() => restore(v.id)}
                      >
                        <Undo2 />
                        Restore
                      </Button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-tertiary">
                  Restoring copies a version into the draft. Nothing goes live until you
                  publish.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* --------------------------------------------- block editor --- */}
        <Card>
          <CardContent className="py-6">
            {!current ? (
              <p className="py-16 text-center text-sm text-ink-tertiary">
                Select a block to edit its content.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-semibold text-ink">
                    {BLOCK_CATALOGUE.find((c) => c.kind === current.kind)?.name}
                  </h2>
                  {!current.visible && <Badge variant="warning">Hidden</Badge>}
                </div>

                {FIELDS[current.kind].map((f) => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <Label htmlFor={`${current.id}-${f.key}`}>{f.label}</Label>
                    {f.long ? (
                      <Textarea
                        id={`${current.id}-${f.key}`}
                        rows={4}
                        value={String(current.data[f.key] ?? "")}
                        onChange={(e) => patch(current.id, f.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={`${current.id}-${f.key}`}
                        value={String(current.data[f.key] ?? "")}
                        onChange={(e) => patch(current.id, f.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                {FIELDS[current.kind].length <= 1 && (
                  <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-xs text-ink-tertiary">
                    Repeatable items for this block (features, plans, questions, quotes)
                    are edited in the next phase. The heading above is live now.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-6 place-items-center rounded text-ink-tertiary transition-colors",
        "hover:bg-surface-sunken hover:text-ink disabled:opacity-30",
        "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
        danger && "hover:bg-danger-subtle hover:text-danger",
        "[&_svg]:size-3.5"
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "saving")
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
        <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
        Saving…
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1.5 text-xs text-success">
        <Check className="size-3.5" aria-hidden />
        Saved
      </span>
    );
  if (state === "dirty")
    return <span className="text-xs text-warning">Unsaved changes</span>;
  if (state === "failed")
    return (
      <span className="flex items-center gap-1.5 text-xs text-danger">
        <CloudOff className="size-3.5" aria-hidden />
        Save failed
        <Button variant="ghost" size="xs" onClick={onRetry}>
          Retry
        </Button>
      </span>
    );
  return null;
}
