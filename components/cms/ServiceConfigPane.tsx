"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Check,
  Eye,
  History,
  Info,
  Loader2,
  Search,
  Undo2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { MediaField } from "@/components/cms/MediaPicker";
import { useToast } from "@/components/ui/toast";
import { scoreSeo, DESCRIPTION_MAX, TITLE_MAX } from "@/lib/seo-score";
import { updateServiceConfig, type ServiceConfig } from "@/lib/supabase/service-config";
import { cn } from "@/lib/utils";

/**
 * The design's "Service Configuration / Structure" rail.
 *
 * It sits beside the page canvas rather than replacing it, because a service is
 * a page: the canvas, autosave, versions and publishing are the page editor's,
 * and only these catalogue fields belong to the service.
 *
 * Sections are a disclosure list matching the design. Which one is open is
 * local UI state — unlike the sidebar, nothing here changes what is reachable,
 * so it does not need to persist.
 */

type SectionId = "info" | "seo" | "visibility";

export function ServiceConfigPane({
  pageId,
  config,
  seo,
  page,
  onSeoChange,
  history,
  onRestore,
  busy,
}: {
  pageId: string;
  config: ServiceConfig | null;
  seo: Record<string, unknown>;
  page: { title: string; slug: string; status: string };
  /** SEO edits flow up to the editor so they ride the same autosave. */
  onSeoChange: (next: Record<string, unknown>) => void;
  history: { id: string; version_number: number; created_at: string }[];
  onRestore: (versionId: string) => void;
  busy: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = React.useState<SectionId | null>("info");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cover, setCover] = React.useState(config?.cover_image_url ?? "");
  const [coverAlt, setCoverAlt] = React.useState(config?.cover_image_alt ?? "");

  // Recomputed on every keystroke from the fields themselves, so the pill can
  // never claim a completeness the page no longer has.
  const score = React.useMemo(
    () => scoreSeo(seo, { title: page.title, slug: page.slug }),
    [seo, page.title, page.slug]
  );

  const title = typeof seo.title === "string" ? seo.title : "";
  const description = typeof seo.description === "string" ? seo.description : "";

  async function saveConfig(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    form.set("coverImageUrl", cover);
    form.set("coverImageAlt", coverAlt);

    const result = await updateServiceConfig(pageId, form);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Service details saved", type: "success" });
    router.refresh();
  }

  const scoreTone =
    score.percent >= 80 ? "text-success" : score.percent >= 50 ? "text-warning" : "text-danger";

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <div className="px-1">
        <p className="text-[0.625rem] font-semibold tracking-widest text-ink-tertiary uppercase">
          {config ? "Service configuration" : "Page configuration"}
        </p>
        <p className="font-heading text-lg font-semibold text-ink">Structure</p>
      </div>

      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* -------------------------------------------------- service info -- */}
      {config && (
        <Section
          id="info"
          icon={Info}
          label="Service Info"
          open={open === "info"}
          onToggle={() => setOpen(open === "info" ? null : "info")}
        >
          <form onSubmit={saveConfig} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sc-category">Category</Label>
              <Input id="sc-category" name="category" defaultValue={config.category} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sc-price">From</Label>
                <Input
                  id="sc-price"
                  name="priceFrom"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Not priced"
                  defaultValue={config.price_from ?? ""}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sc-lead">Lead (wks)</Label>
                <Input
                  id="sc-lead"
                  name="leadTimeWeeks"
                  type="number"
                  min="0"
                  max="260"
                  placeholder="—"
                  defaultValue={config.lead_time_weeks ?? ""}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sc-summary">Catalogue summary</Label>
              <Textarea
                id="sc-summary"
                name="summary"
                rows={2}
                maxLength={400}
                defaultValue={config.summary ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Cover image</Label>
              {/* The same picker the canvas uses, so there is one media chooser
                  in the product rather than two that drift apart. */}
              <MediaField
                value={cover}
                alt={coverAlt}
                label=""
                onChange={(next) => {
                  setCover(next.url);
                  setCoverAlt(next.alt);
                }}
              />
            </div>

            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
              Save service details
            </Button>
            <p className="text-[0.6875rem] text-ink-tertiary">
              Catalogue fields save on their own. Page content autosaves as you
              type.
            </p>
          </form>
        </Section>
      )}

      {/* ---------------------------------------------------- seo settings -- */}
      <Section
        id="seo"
        icon={Search}
        label="SEO Settings"
        open={open === "seo"}
        onToggle={() => setOpen(open === "seo" ? null : "seo")}
        trailing={
          <span className={cn("flex items-center gap-1.5 text-[0.6875rem] font-bold", scoreTone)}>
            <span
              className={cn(
                "size-1.5 rounded-full",
                score.percent >= 80 ? "bg-success" : score.percent >= 50 ? "bg-warning" : "bg-danger"
              )}
              aria-hidden
            />
            {score.percent}%
          </span>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="seo-title">Search title</Label>
              <span
                data-tabular
                className={cn(
                  "text-[0.625rem]",
                  title.length > TITLE_MAX ? "text-warning" : "text-ink-tertiary"
                )}
              >
                {title.length} / {TITLE_MAX}
              </span>
            </div>
            <Input
              id="seo-title"
              value={title}
              onChange={(e) => onSeoChange({ ...seo, title: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="seo-description">Meta description</Label>
              <span
                data-tabular
                className={cn(
                  "text-[0.625rem]",
                  description.length > DESCRIPTION_MAX ? "text-warning" : "text-ink-tertiary"
                )}
              >
                {description.length} / {DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="seo-description"
              rows={3}
              value={description}
              onChange={(e) => onSeoChange({ ...seo, description: e.target.value })}
            />
          </div>

          {/* The score is completeness, not quality — so it lists exactly what
              it checked rather than presenting a number with no account. */}
          <ul className="flex flex-col gap-1.5 border-t border-line-subtle pt-3">
            {score.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-[0.6875rem]">
                <span
                  className={cn(
                    "mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full",
                    c.passed ? "bg-success-subtle text-success" : "bg-surface-sunken text-ink-tertiary"
                  )}
                >
                  {c.passed ? <Check className="size-2.5" aria-hidden /> : null}
                </span>
                <span className={c.passed ? "text-ink-secondary" : "text-ink-tertiary"}>
                  {c.label}
                  {!c.passed && <span className="block text-ink-tertiary">{c.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ----------------------------------------------------- visibility -- */}
      <Section
        id="visibility"
        icon={Eye}
        label="Visibility"
        open={open === "visibility"}
        onToggle={() => setOpen(open === "visibility" ? null : "visibility")}
        trailing={
          <Badge variant={page.status === "published" ? "success" : "warning"} size="sm">
            {page.status}
          </Badge>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-[0.6875rem] text-ink-tertiary">
            {page.status === "published"
              ? "This page is live. Publishing again replaces it with the current draft."
              : "Nothing is public yet. Publishing makes this URL live immediately."}
          </p>
          <code className="rounded-md bg-surface-sunken px-2 py-1 font-mono text-[0.6875rem] text-ink-secondary">
            /{page.slug}
          </code>
        </div>
      </Section>

      {/* -------------------------------------------------------- history -- */}
      {history.length > 0 && (
        <Section
          id="history"
          icon={History}
          label="History"
          open={open === null}
          onToggle={() => setOpen(open === null ? "info" : null)}
        >
          <ul className="flex flex-col gap-1">
            {history.slice(0, 8).map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2">
                <span className="text-[0.6875rem] text-ink-secondary">
                  v{v.version_number} ·{" "}
                  {new Date(v.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <Button variant="ghost" size="xs" disabled={busy} onClick={() => onRestore(v.id)}>
                  <Undo2 />
                  Restore
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.6875rem] text-ink-tertiary">
            Restoring copies a version into the draft. Nothing goes live until
            you publish.
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  open,
  onToggle,
  trailing,
  children,
}: {
  id: string;
  icon: typeof Info;
  label: string;
  open: boolean;
  onToggle: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panelId = `cfg-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="overflow-hidden rounded-lg border border-line-subtle">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
          "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
          open ? "border-l-2 border-brand bg-brand-subtle/30 text-brand-subtle-fg" : "text-ink-secondary hover:bg-surface-sunken"
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-[0.8125rem] font-medium">{label}</span>
        {trailing}
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <div id={panelId} className="border-t border-line-subtle bg-surface-sunken/40 p-3">
          {children}
        </div>
      )}
    </div>
  );
}
