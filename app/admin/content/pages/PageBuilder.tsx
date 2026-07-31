"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Monitor,
  Plus,
  Route,
  Smartphone,
  SlidersHorizontal,
  Tablet,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  blockMeta,
  landingPages,
  navParents,
  pageStatusTone,
  pageTypes,
  type LandingPage,
  type PageBlock,
} from "@/lib/pages";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const viewports = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "48rem" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "23.4375rem" },
] as const;

export function PageBuilder({ pageId }: { pageId: string }) {
  const source = landingPages.find((p) => p.id === pageId) ?? landingPages[0];

  const [page, setPage] = React.useState<LandingPage>(source);
  const [viewport, setViewport] = React.useState<(typeof viewports)[number]["id"]>("desktop");
  const [notice, setNotice] = React.useState<string | null>(null);

  // Keep local edits when switching pages from the list above.
  React.useEffect(() => setPage(source), [source]);

  function move(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= page.blocks.length) return;
    setPage((p) => {
      const blocks = [...p.blocks];
      [blocks[index], blocks[next]] = [blocks[next], blocks[index]];
      return { ...p, blocks };
    });
    setNotice(null);
  }

  function toggleVisible(id: string) {
    setPage((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)),
    }));
  }

  function remove(id: string) {
    setPage((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }));
  }

  const visibleBlocks = page.blocks.filter((b) => b.visible);

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      {/* ── Outline ─────────────────────────────────────────────────────── */}
      <section
        aria-label="Page settings"
        className="scrollbar-none flex min-h-0 shrink-0 flex-col gap-8 overflow-y-auto border-line p-5 lg:p-6 xl:w-[26rem] xl:border-r"
      >
        <Group icon={SlidersHorizontal} title="Page metadata">
          <Field label="Page title" id="page-title">
            <Input
              id="page-title"
              value={page.title}
              onChange={(e) => setPage((p) => ({ ...p, title: e.target.value }))}
            />
          </Field>

          <Field label="URL slug" id="page-slug">
            <div className="flex">
              <span className="grid shrink-0 place-items-center rounded-l-lg border border-r-0 border-line bg-surface-sunken px-3 text-[0.8125rem] text-ink-tertiary">
                nexus.agency/
              </span>
              <Input
                id="page-slug"
                value={page.slug}
                onChange={(e) => setPage((p) => ({ ...p, slug: e.target.value }))}
                className="rounded-l-none font-mono"
              />
            </div>
          </Field>

          <Field label="Page type" id="page-type">
            <select
              id="page-type"
              value={page.typeId}
              onChange={(e) =>
                setPage((p) => ({ ...p, typeId: e.target.value as LandingPage["typeId"] }))
              }
              className={cn(
                "h-9.5 w-full cursor-pointer rounded-lg border border-line bg-surface-sunken px-3",
                "text-[0.8125rem] font-medium text-ink transition-colors hover:border-line-strong",
                "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              )}
            >
              {pageTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </Field>
        </Group>

        {/* ── Blocks ────────────────────────────────────────────────────── */}
        <Group
          icon={Layers}
          title="Content blocks"
          aside={
            <span className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
              <span data-tabular>{page.blocks.length}</span> blocks
            </span>
          }
        >
          {/* Reordering is buttons, not drag. The source was `cursor-move` with
              no handler at all — and even implemented, pointer-only dragging is
              unusable by keyboard. */}
          <ol className="flex flex-col gap-2">
            {page.blocks.map((block, i) => (
              <li key={block.id}>
                <BlockRow
                  block={block}
                  index={i}
                  total={page.blocks.length}
                  onMove={move}
                  onToggle={toggleVisible}
                  onRemove={remove}
                />
              </li>
            ))}
          </ol>

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setNotice("insert")}
          >
            <Plus />
            Insert component
          </Button>

          {notice === "insert" && (
            <Alert tone="warning">
              <AlertTitle>Block library not connected</AlertTitle>
              <AlertDescription>
                {/* TODO: open the block picker once the pages API exists. */}
                Nothing was added — the component library is not wired up yet.
              </AlertDescription>
            </Alert>
          )}
        </Group>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <Group icon={Route} title="Navigation placement">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={page.nav.inMainNav}
              onCheckedChange={(checked) =>
                setPage((p) => ({ ...p, nav: { ...p.nav, inMainNav: Boolean(checked) } }))
              }
            />
            <span className="text-[0.875rem] font-medium text-ink">
              Add to main navigation
            </span>
          </label>

          {/* The parent and label only matter once it is in the nav, so they
              appear when the box is ticked rather than sitting there inert. */}
          {page.nav.inMainNav && (
            <>
              <Field label="Parent menu" id="nav-parent">
                <select
                  id="nav-parent"
                  value={page.nav.parent ?? "Root level"}
                  onChange={(e) =>
                    setPage((p) => ({
                      ...p,
                      nav: {
                        ...p.nav,
                        parent: e.target.value === "Root level" ? null : e.target.value,
                      },
                    }))
                  }
                  className={cn(
                    "h-9.5 w-full cursor-pointer rounded-lg border border-line bg-surface-sunken px-3",
                    "text-[0.8125rem] font-medium text-ink transition-colors hover:border-line-strong",
                    "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                  )}
                >
                  {navParents.map((parent) => (
                    <option key={parent} value={parent}>
                      {parent}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Navigation label" id="nav-label">
                <Input
                  id="nav-label"
                  value={page.nav.label}
                  onChange={(e) =>
                    setPage((p) => ({ ...p, nav: { ...p.nav, label: e.target.value } }))
                  }
                  placeholder={page.title}
                />
              </Field>
            </>
          )}
        </Group>
      </section>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <section aria-label="Preview" className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 lg:px-6">
          <div
            role="group"
            aria-label="Preview width"
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-sunken p-1"
          >
            {viewports.map((v) => {
              const active = viewport === v.id;
              return (
                <Tooltip key={v.id}>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-pressed={active}
                        aria-label={v.label}
                        onClick={() => setViewport(v.id)}
                        className={cn(active && "bg-surface text-brand")}
                      >
                        <v.icon />
                      </Button>
                    }
                  />
                  <TooltipContent>{v.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={pageStatusTone[page.status]}>{page.status}</Badge>
            <Button variant="outline" size="sm" onClick={() => setNotice("preview")}>
              <Eye />
              Preview draft
            </Button>
            <Button
              size="sm"
              onClick={() => setNotice("publish")}
              className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
            >
              Publish
            </Button>
          </div>
        </div>

        {(notice === "publish" || notice === "preview") && (
          <div className="border-b border-line p-4 lg:px-6">
            <Alert tone="warning">
              <AlertTitle>Nothing was published</AlertTitle>
              <AlertDescription>
                {/* TODO: POST to the pages API. Publishing must also invalidate
                    the route cache for the slug. */}
                The pages API is not connected, so {page.slug} is unchanged.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* tabIndex makes the scroll area reachable by keyboard — it has no
            focusable children, so without it the region cannot be scrolled
            without a pointer. */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Page preview"
          className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-canvas p-4 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none lg:p-8"
        >
          <div
            className="mx-auto flex flex-col gap-6 transition-[max-width] duration-(--duration-slow) ease-(--ease-out-quint)"
            style={{ maxWidth: viewports.find((v) => v.id === viewport)!.width }}
          >
            {visibleBlocks.map((block) => (
              <BlockPreview key={block.id} block={block} />
            ))}

            {visibleBlocks.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-line px-6 py-20 text-center text-ink-tertiary">
                Every block is hidden. Show one to preview the page.
              </p>
            )}

            <p className="rounded-2xl border-2 border-dashed border-line px-6 py-10 text-center text-[0.75rem] font-bold tracking-widest text-ink-tertiary uppercase">
              End of page
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function BlockRow({
  block,
  index,
  total,
  onMove,
  onToggle,
  onRemove,
}: {
  block: PageBlock;
  index: number;
  total: number;
  onMove: (index: number, delta: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const meta = blockMeta(block.kind);

  return (
    <Card
      variant="glass"
      className={cn(
        "flex-row items-center gap-3 rounded-xl p-3",
        "transition-[border-color,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
        "hover:-translate-y-0.5 hover:border-brand-line",
        !block.visible && "opacity-60"
      )}
    >
      <div className="flex shrink-0 flex-col">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Move ${meta.name} up`}
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
        >
          <ChevronUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Move ${meta.name} down`}
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
        >
          <ChevronDown />
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.875rem] font-semibold text-ink">{meta.name}</p>
        <p className="truncate text-[0.6875rem] text-ink-tertiary">{block.variant}</p>
      </div>

      {meta.required && (
        <Badge variant="brand" size="sm" className="shrink-0 tracking-wider uppercase">
          Required
        </Badge>
      )}
      {block.experiment && (
        <Badge variant="ion" size="sm" className="shrink-0 tracking-wider uppercase">
          A/B
        </Badge>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${block.visible ? "Hide" : "Show"} ${meta.name}`}
        aria-pressed={block.visible}
        onClick={() => onToggle(block.id)}
      >
        {block.visible ? <Eye /> : <EyeOff />}
      </Button>

      {/* A required block has no remove control at all, rather than one that
          silently refuses. */}
      {!meta.required && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${meta.name}`}
          onClick={() => onRemove(block.id)}
        >
          <Trash2 className="text-danger" />
        </Button>
      )}
    </Card>
  );
}

/** Schematic preview — shape and order, not a pixel rendition. */
function BlockPreview({ block }: { block: PageBlock }) {
  const meta = blockMeta(block.kind);

  return (
    <Card variant="glass" className="gap-4 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.625rem] font-bold tracking-widest text-brand uppercase">
          {meta.name}
        </span>
        <span className="text-[0.625rem] text-ink-tertiary">{block.variant}</span>
      </div>

      {block.kind === "hero" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="h-2.5 w-24 rounded-full bg-brand/40" />
          <span className="h-6 w-3/4 rounded-lg bg-ink/20" />
          <span className="h-3 w-2/3 rounded bg-ink/10" />
          <span className="mt-2 h-8 w-32 rounded-lg bg-brand/60" />
        </div>
      )}

      {block.kind === "featureGrid" && (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-surface-sunken p-4">
              <span className="size-8 rounded-lg bg-ion/30" />
              <span className="h-2.5 w-2/3 rounded bg-ink/20" />
              <span className="h-2 w-full rounded bg-ink/10" />
            </div>
          ))}
        </div>
      )}

      {block.kind === "pricing" && (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-3",
                i === 1 ? "bg-brand-subtle ring-1 ring-brand-line" : "bg-surface-sunken"
              )}
            >
              <span className="h-2 w-10 rounded bg-ink/20" />
              <span className="h-5 w-12 rounded bg-ink/25" />
              <span className="h-6 w-full rounded bg-brand/40" />
            </div>
          ))}
        </div>
      )}

      {(block.kind === "faq" || block.kind === "richText") && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-8 rounded-lg bg-surface-sunken" />
          ))}
        </div>
      )}

      {block.kind === "testimonials" && (
        <div className="flex gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-3 rounded-xl bg-surface-sunken p-3">
              <span className="size-8 shrink-0 rounded-full bg-ion/30" />
              <span className="flex-1">
                <span className="mb-1.5 block h-2 w-full rounded bg-ink/15" />
                <span className="block h-2 w-2/3 rounded bg-ink/10" />
              </span>
            </div>
          ))}
        </div>
      )}

      {block.kind === "cta" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-brand-subtle p-5">
          <span className="h-4 w-1/2 rounded bg-ink/20" />
          <span className="h-8 w-28 rounded-lg bg-brand/60" />
        </div>
      )}
    </Card>
  );
}

function Group({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: typeof Layers;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[0.875rem] font-semibold text-ink">
          <Icon className="size-4 shrink-0 text-brand" aria-hidden />
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
