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
  GripVertical,
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
import { MediaField } from "@/components/cms/MediaPicker";
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

/**
 * Which fields each block kind exposes. Drives the editor with no per-kind UI.
 *
 * `media` renders the library picker instead of a text input. It owns two keys
 * at once — the URL and the alt text — because choosing an asset supplies both,
 * and letting them drift apart is how images end up unlabelled.
 */
const FIELDS: Record<
  PageBlock["kind"],
  { key: string; label: string; long?: boolean; media?: boolean; altKey?: string }[]
> = {
  hero: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "heading", label: "Heading" },
    { key: "body", label: "Body", long: true },
    { key: "ctaLabel", label: "Button label" },
    { key: "ctaHref", label: "Button URL" },
    { key: "imageUrl", label: "Image", media: true, altKey: "imageAlt" },
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

/**
 * Repeatable content. Each entry describes the fields ONE item exposes, so the
 * repeater below serves every block kind without a bespoke editor per kind.
 * `nested` declares a second level — a pricing package owns its feature list.
 */
type ItemField = { key: string; label: string; long?: boolean; bool?: boolean };

const ITEM_SCHEMA: Partial<
  Record<
    PageBlock["kind"],
    {
      singular: string;
      fields: ItemField[];
      nested?: { key: string; singular: string; fields: ItemField[] };
    }
  >
> = {
  featureGrid: {
    singular: "feature",
    fields: [
      { key: "title", label: "Title" },
      { key: "body", label: "Description", long: true },
    ],
  },
  pricing: {
    singular: "package",
    fields: [
      { key: "name", label: "Package name" },
      { key: "price", label: "Price" },
      { key: "interval", label: "Billing interval" },
      { key: "body", label: "Description", long: true },
      { key: "badge", label: "Badge" },
      { key: "ctaLabel", label: "Button label" },
      { key: "ctaHref", label: "Button URL" },
      { key: "featured", label: "Highlight this package", bool: true },
    ],
    nested: {
      key: "features",
      singular: "feature",
      fields: [{ key: "label", label: "Feature" }],
    },
  },
  faq: {
    singular: "question",
    fields: [
      { key: "question", label: "Question" },
      { key: "answer", label: "Answer", long: true },
    ],
  },
  testimonials: {
    singular: "testimonial",
    fields: [
      { key: "quote", label: "Quote", long: true },
      { key: "name", label: "Name" },
      { key: "role", label: "Role and company" },
    ],
  },
};

type Item = Record<string, unknown>;

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

  /**
   * Drag-and-drop reordering.
   *
   * Native HTML5 drag events rather than a library: the list is small, the
   * blocks are already keyed by id, and a dependency here would have to be
   * kept in step with the Base UI focus handling for no gain.
   *
   * `dragOver` is tracked separately from `dragging` so the drop indicator can
   * render between rows — a highlight on the row itself reads as "replace
   * this" rather than "insert here".
   */
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  function onDrop(targetId: string) {
    const sourceId = dragging;
    setDragging(null);
    setDragOver(null);
    if (!sourceId || sourceId === targetId) return;

    setBlocks((bs) => {
      const from = bs.findIndex((b) => b.id === sourceId);
      const to = bs.findIndex((b) => b.id === targetId);
      if (from < 0 || to < 0) return bs;
      const next = [...bs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setSelected(sourceId);
  }

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
                  <li
                    key={b.id}
                    draggable
                    onDragStart={() => setDragging(b.id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOver(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragging && dragging !== b.id) setDragOver(b.id);
                    }}
                    onDragLeave={() => setDragOver((d) => (d === b.id ? null : d))}
                    onDrop={(e) => {
                      e.preventDefault();
                      onDrop(b.id);
                    }}
                    className={cn(
                      "rounded-lg transition-[box-shadow,opacity]",
                      dragging === b.id && "opacity-40",
                      dragOver === b.id && "shadow-[inset_0_2px_0_0_var(--brand)]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors",
                        selected === b.id ? "border-brand bg-brand-subtle" : "border-transparent"
                      )}
                    >
                      <span
                        aria-hidden
                        className="cursor-grab text-ink-tertiary active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        <GripVertical className="size-3.5" />
                      </span>
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

                {FIELDS[current.kind].map((f) =>
                  f.media ? (
                    <MediaField
                      key={f.key}
                      label={f.label}
                      value={String(current.data[f.key] ?? "")}
                      alt={String(current.data[f.altKey ?? "imageAlt"] ?? "")}
                      onChange={({ url, alt }) =>
                        setBlocks((bs) =>
                          bs.map((b) =>
                            b.id === current.id
                              ? {
                                  ...b,
                                  data: {
                                    ...b.data,
                                    [f.key]: url,
                                    [f.altKey ?? "imageAlt"]: alt,
                                  },
                                }
                              : b
                          )
                        )
                      }
                    />
                  ) : (
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
                  )
                )}

                {ITEM_SCHEMA[current.kind] && (
                  <Repeater
                    schema={ITEM_SCHEMA[current.kind]!}
                    items={(current.data.items as Item[]) ?? []}
                    onChange={(items) =>
                      setBlocks((bs) =>
                        bs.map((b) =>
                          b.id === current.id ? { ...b, data: { ...b.data, items } } : b
                        )
                      )
                    }
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Add, edit, duplicate, delete and reorder the items inside a block, plus one
 * level of nesting for pricing features. Every change flows through `onChange`
 * into the block tree, so autosave and publish need no special handling.
 */
function Repeater({
  schema,
  items,
  onChange,
}: {
  schema: NonNullable<(typeof ITEM_SCHEMA)[PageBlock["kind"]]>;
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  const [open, setOpen] = React.useState<number | null>(items.length ? 0 : null);

  const set = (i: number, key: string, value: unknown) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: value } : it)));

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-line-subtle pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
          {items.length} {schema.singular}
          {items.length === 1 ? "" : "s"}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            onChange([...items, {}]);
            setOpen(items.length);
          }}
        >
          <Plus />
          Add {schema.singular}
        </Button>
      </div>

      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-xs text-ink-tertiary">
          No {schema.singular}s yet. This block renders nothing until you add one.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item, i) => {
          const expanded = open === i;
          const label =
            String(item.name ?? item.title ?? item.question ?? item.quote ?? "") ||
            `Untitled ${schema.singular}`;
          return (
            <li key={i} className="rounded-lg border border-line">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : i)}
                  aria-expanded={expanded}
                  className="min-w-0 flex-1 truncate text-left text-sm text-ink"
                >
                  {i + 1}. {label}
                </button>
                <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp />
                </IconBtn>
                <IconBtn
                  label="Move down"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                >
                  <ArrowDown />
                </IconBtn>
                <IconBtn
                  label="Duplicate"
                  onClick={() => {
                    const next = [...items];
                    next.splice(i + 1, 0, { ...item });
                    onChange(next);
                    setOpen(i + 1);
                  }}
                >
                  <Copy />
                </IconBtn>
                <IconBtn
                  label="Delete"
                  danger
                  onClick={() => {
                    onChange(items.filter((_, j) => j !== i));
                    setOpen(null);
                  }}
                >
                  <Trash2 />
                </IconBtn>
              </div>

              {expanded && (
                <div className="flex flex-col gap-3 border-t border-line-subtle px-3 py-3">
                  {schema.fields.map((f) =>
                    f.bool ? (
                      <label key={f.key} className="flex items-center gap-2 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={item[f.key] === true}
                          onChange={(e) => set(i, f.key, e.target.checked)}
                          className="size-4"
                        />
                        {f.label}
                      </label>
                    ) : (
                      <div key={f.key} className="flex flex-col gap-1">
                        <Label htmlFor={`item-${i}-${f.key}`}>{f.label}</Label>
                        {f.long ? (
                          <Textarea
                            id={`item-${i}-${f.key}`}
                            rows={3}
                            value={String(item[f.key] ?? "")}
                            onChange={(e) => set(i, f.key, e.target.value)}
                          />
                        ) : (
                          <Input
                            id={`item-${i}-${f.key}`}
                            value={String(item[f.key] ?? "")}
                            onChange={(e) => set(i, f.key, e.target.value)}
                          />
                        )}
                      </div>
                    )
                  )}

                  {schema.nested && (
                    <NestedList
                      singular={schema.nested.singular}
                      fields={schema.nested.fields}
                      values={(item[schema.nested.key] as Item[]) ?? []}
                      onChange={(v) => set(i, schema.nested!.key, v)}
                    />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The second level — a pricing package's feature list. */
function NestedList({
  singular,
  fields,
  values,
  onChange,
}: {
  singular: string;
  fields: ItemField[];
  values: Item[];
  onChange: (v: Item[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-sunken/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
          {values.length} {singular}
          {values.length === 1 ? "" : "s"}
        </span>
        <Button type="button" variant="ghost" size="xs" onClick={() => onChange([...values, {}])}>
          <Plus />
          Add
        </Button>
      </div>
      {values.map((v, k) => (
        <div key={k} className="flex items-center gap-1">
          <Input
            aria-label={`${singular} ${k + 1}`}
            value={String(v[fields[0].key] ?? "")}
            onChange={(e) =>
              onChange(
                values.map((x, j) => (j === k ? { ...x, [fields[0].key]: e.target.value } : x))
              )
            }
          />
          <IconBtn
            label="Move up"
            disabled={k === 0}
            onClick={() => {
              const next = [...values];
              [next[k - 1], next[k]] = [next[k], next[k - 1]];
              onChange(next);
            }}
          >
            <ArrowUp />
          </IconBtn>
          <IconBtn label="Delete" danger onClick={() => onChange(values.filter((_, j) => j !== k))}>
            <Trash2 />
          </IconBtn>
        </div>
      ))}
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
