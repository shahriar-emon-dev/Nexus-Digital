"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Megaphone,
  Package,
  Sparkles,
  SplitSquareHorizontal,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  blockMeta,
  pageTypeById,
  pageTypes,
  templateCategories,
  templatesFor,
  type PageTypeId,
  type TemplateCategory,
} from "@/lib/pages";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const typeIcons: Record<PageTypeId, LucideIcon> = {
  standard: FileText,
  dynamic: Sparkles,
  marketing: Megaphone,
  product: Package,
  variant: SplitSquareHorizontal,
};

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Two-step page creation.
 *
 * The source's steps were absolutely-positioned siblings toggled by class, so
 * the hidden step stayed focusable and in the accessibility tree. Here only the
 * current step is rendered, the indicator reflects real state, and Continue is
 * genuinely disabled until something is chosen.
 */
export function CreatePageWizard() {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [typeId, setTypeId] = React.useState<PageTypeId | null>(null);
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<TemplateCategory | "all">("all");
  const [submitted, setSubmitted] = React.useState(false);

  const type = typeId ? pageTypeById(typeId) : null;

  // Only templates that suit the chosen type — that is the whole reason the
  // type question comes first.
  const available = React.useMemo(() => {
    if (!typeId) return [];
    const list = templatesFor(typeId);
    return category === "all" ? list : list.filter((t) => t.category === category);
  }, [typeId, category]);

  const categories = React.useMemo(() => {
    if (!typeId) return [];
    const suited = new Set(templatesFor(typeId).map((t) => t.category));
    return templateCategories.filter((c) => suited.has(c));
  }, [typeId]);

  return (
    <Card variant="glass" className="gap-0 overflow-hidden rounded-2xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink">
            Create new page
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
            {step === 1
              ? "Pick the architecture, then a starting point."
              : `${type?.name} — choose a template.`}
          </p>
        </div>

        <ol className="flex items-center gap-3" aria-label="Progress">
          {([1, 2] as const).map((n, i) => {
            const done = step > n;
            const active = step === n;
            return (
              <li key={n} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="h-px w-8 bg-line" />}
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-[0.75rem] font-bold",
                    "transition-colors duration-(--duration-normal)",
                    done
                      ? "bg-success-subtle text-success"
                      : active
                        ? "bg-brand text-brand-fg"
                        : "border border-line text-ink-tertiary"
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : n}
                  <span className="sr-only">
                    Step {n}
                    {done ? " complete" : active ? " current" : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="p-6 lg:p-8">
        {step === 1 ? (
          <fieldset>
            <legend className="sr-only">Page type</legend>
            <h2 className="font-heading text-2xl leading-tight font-semibold text-ink">
              What are we building?
            </h2>
            <p className="mt-2 max-w-xl text-ink-tertiary">
              Each type starts with a different set of blocks and a different
              performance profile.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {pageTypes.map((option) => {
                const Icon = typeIcons[option.id];
                const selected = typeId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setTypeId(option.id);
                      setTemplateId(null);
                      setCategory("all");
                    }}
                    className={cn(
                      "group flex flex-col items-start gap-3 rounded-xl border p-5 text-left",
                      "transition-[border-color,background-color,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
                      "hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                      selected
                        ? "border-brand bg-brand-subtle"
                        : "border-line bg-surface-sunken hover:border-line-strong"
                    )}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <Icon
                        className={cn(
                          "size-7 shrink-0 transition-transform duration-(--duration-normal) group-hover:scale-110",
                          selected ? "text-brand" : "text-ink-tertiary"
                        )}
                        aria-hidden
                      />
                      {selected && (
                        <Check className="size-4 shrink-0 text-brand" aria-hidden />
                      )}
                    </span>

                    <span>
                      <span
                        className={cn(
                          "block font-heading text-[1.0625rem] font-semibold",
                          selected ? "text-brand" : "text-ink"
                        )}
                      >
                        {option.name}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] text-ink-tertiary">
                        {option.blurb}
                      </span>
                    </span>

                    {option.recommended && (
                      <Badge variant="ion" size="sm" className="tracking-wider uppercase">
                        Most used
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Says what the choice actually does, rather than leaving it implied. */}
            {type && (
              <p className="mt-6 text-[0.8125rem] text-ink-tertiary">
                {type.starterBlocks.length > 0 ? (
                  <>
                    Starts with{" "}
                    <span className="text-ink-secondary">
                      {type.starterBlocks.map((b) => blockMeta(b).name).join(", ")}
                    </span>
                    .
                  </>
                ) : (
                  "Starts from an existing page you choose next."
                )}
              </p>
            )}
          </fieldset>
        ) : (
          <fieldset>
            <legend className="sr-only">Starting template</legend>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl leading-tight font-semibold text-ink">
                  Choose a starting point
                </h2>
                <p className="mt-2 text-ink-tertiary">
                  <span data-tabular>{templatesFor(typeId!).length}</span> templates suit a{" "}
                  {type?.name} page.
                </p>
              </div>

              {categories.length > 1 && (
                <div
                  role="group"
                  aria-label="Filter templates"
                  className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface-sunken p-1"
                >
                  {(["all", ...categories] as const).map((c) => {
                    const selected = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setCategory(c as TemplateCategory | "all")}
                        className={cn(
                          "rounded px-3 py-1.5 text-[0.75rem] font-semibold transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                          selected
                            ? "bg-brand text-brand-fg"
                            : "text-ink-tertiary hover:bg-surface hover:text-ink"
                        )}
                      >
                        {c === "all" ? "All" : c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {available.map((template) => {
                const selected = templateId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTemplateId(template.id)}
                    className={cn(
                      "group flex flex-col text-left",
                      "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    )}
                  >
                    <span
                      className={cn(
                        "relative block aspect-4/5 overflow-hidden rounded-xl border bg-surface-sunken",
                        "transition-[border-color,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
                        "group-hover:-translate-y-0.5",
                        selected ? "border-brand ring-1 ring-brand-line" : "border-line"
                      )}
                    >
                      {template.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={template.image}
                          alt={template.alt}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-(--duration-deliberate) ease-(--ease-out-quint) group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-[0.75rem] font-semibold text-ink-tertiary">
                          Empty page
                        </span>
                      )}

                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-canvas to-transparent p-3">
                        <Badge variant="brand" size="sm" className="tracking-wider uppercase">
                          {template.tag}
                        </Badge>
                        <span className="flex items-center gap-1 text-[0.625rem] text-ink-secondary">
                          <TrendingUp className="size-3" aria-hidden />
                          <span data-tabular>{compact.format(template.uses)}</span> used
                        </span>
                      </span>

                      {selected && (
                        <span className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-brand text-brand-fg">
                          <Check className="size-3.5" aria-hidden />
                        </span>
                      )}
                    </span>

                    <span
                      className={cn(
                        "mt-3 font-heading text-[0.9375rem] font-semibold transition-colors",
                        selected ? "text-brand" : "text-ink group-hover:text-brand"
                      )}
                    >
                      {template.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {available.length === 0 && (
              <p className="mt-8 rounded-xl border border-dashed border-line px-6 py-12 text-center text-ink-tertiary">
                No templates in that category for a {type?.name} page.
              </p>
            )}

            {submitted && (
              <Alert tone="warning" className="mt-8">
                <AlertTitle>Draft not created</AlertTitle>
                <AlertDescription>
                  {/* TODO: POST to the pages API, then redirect to the builder
                      for the new page id. */}
                  The pages API is not connected yet, so nothing was saved.
                </AlertDescription>
              </Alert>
            )}
          </fieldset>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface-sunken/50 px-6 py-5">
        <Button
          variant="ghost"
          onClick={() => setStep(1)}
          className={cn(step === 1 && "invisible")}
        >
          <ArrowLeft />
          Back
        </Button>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href="/admin/content/pages" />}>
            Cancel
          </Button>

          {step === 1 ? (
            <Button disabled={!typeId} onClick={() => setStep(2)}>
              Continue
              <ArrowRight />
            </Button>
          ) : (
            <Button
              disabled={!templateId}
              onClick={() => setSubmitted(true)}
              className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
            >
              Create draft
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
