"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDashed,
  Copy,
  LayoutTemplate,
  PlusCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  duplicatable,
  sectionMeta,
  serviceCategories,
  serviceTemplates,
  slugTaken,
  templateById,
  toSlug,
  type ServiceCategory,
  type StartingPoint,
} from "@/lib/services";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

const steps = [
  { n: 1, code: "Strategy", label: "Starting point" },
  { n: 2, code: "Metadata", label: "Identity and tags" },
] as const;

const startOptions: {
  id: StartingPoint;
  name: string;
  blurb: string;
  icon: typeof PlusCircle;
}[] = [
  {
    id: "blank",
    name: "Start from blank",
    blurb: "A hero section and nothing else. Build the page up yourself.",
    icon: PlusCircle,
  },
  {
    id: "template",
    name: "Use a blueprint",
    blurb: "Start with the sections a service of this shape usually needs.",
    icon: LayoutTemplate,
  },
  {
    id: "duplicate",
    name: "Duplicate existing",
    blurb: "Clone a live service, its sections and its settings.",
    icon: Copy,
  },
];

/**
 * Two-step service creation.
 *
 * The source ended in `alert('Service container … initialized successfully')`
 * followed by `window.location.reload()` — a fabricated success that also threw
 * away everything typed. Here the final step validates, then says plainly that
 * nothing was created, and the form keeps its values.
 */
export function CreateServiceWizard() {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [start, setStart] = React.useState<StartingPoint | null>(null);
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [sourceId, setSourceId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [slug, setSlug] = React.useState("");
  const [category, setCategory] = React.useState<ServiceCategory>(serviceCategories[0]);
  const [summary, setSummary] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  // The slug follows the name until it is edited by hand, then stops.
  const effectiveSlug = slugEdited ? slug : toSlug(name);
  const taken = effectiveSlug !== "" && slugTaken(effectiveSlug);
  const slugValid = effectiveSlug.length >= 3 && !taken;

  const startReady =
    start === "blank" ||
    (start === "template" && Boolean(templateId)) ||
    (start === "duplicate" && Boolean(sourceId));

  const metaReady = name.trim().length >= 3 && slugValid;

  // What the new service will actually begin with — stated, not implied.
  const startingSections = React.useMemo(() => {
    if (start === "template" && templateId) return templateById(templateId)?.sections ?? [];
    if (start === "duplicate" && sourceId)
      return duplicatable.find((s) => s.id === sourceId)?.sections.map((s) => s.kind) ?? [];
    return ["hero" as const];
  }, [start, templateId, sourceId]);

  return (
    <Card variant="glass" className="gap-0 overflow-hidden rounded-3xl md:flex-row">
      {/* ── Progress rail ───────────────────────────────────────────────── */}
      <aside className="shrink-0 border-line bg-surface-sunken/50 p-6 md:w-64 md:border-r lg:p-8">
        <div className="mb-8">
          <p className="font-heading text-xl font-bold tracking-tight text-brand">Nexus</p>
          <p className="text-[0.6875rem] tracking-widest text-ink-tertiary uppercase">
            Service catalogue
          </p>
        </div>

        <ol className="flex gap-6 md:flex-col">
          {steps.map((s) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <li key={s.n} className="flex items-center gap-3">
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-[0.8125rem] font-bold",
                    "transition-colors duration-(--duration-normal)",
                    done
                      ? "bg-success-subtle text-success"
                      : active
                        ? "bg-brand text-brand-fg shadow-[0_0_16px_var(--brand-glow)]"
                        : "border border-line text-ink-tertiary"
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : s.n}
                </span>
                <span className={cn("min-w-0", !active && !done && "opacity-60")}>
                  <span
                    className={cn(
                      "block text-[0.6875rem] font-bold tracking-widest uppercase",
                      active ? "text-brand" : "text-ink-tertiary"
                    )}
                  >
                    {s.code}
                  </span>
                  <span className="block text-[0.8125rem] text-ink">{s.label}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 p-6 lg:p-10">
          {step === 1 ? (
            <fieldset>
              <legend className="sr-only">Starting point</legend>
              <h1 className="font-heading text-2xl leading-tight font-bold tracking-tight text-ink">
                Create a new service
              </h1>
              <p className="mt-2 text-ink-tertiary">
                Choose what the new service page starts from.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {startOptions.map((option) => {
                  const selected = start === option.id;
                  return (
                    <div key={option.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setStart(option.id);
                          setTemplateId(null);
                          setSourceId(null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl border p-5 text-left",
                          "transition-[border-color,background-color,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
                          "hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                          selected
                            ? "border-brand bg-brand-subtle"
                            : "border-line bg-surface-sunken hover:border-line-strong"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-12 shrink-0 place-items-center rounded-xl",
                            selected
                              ? "bg-brand text-brand-fg"
                              : "bg-surface text-ink-tertiary"
                          )}
                        >
                          <option.icon className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block font-heading text-lg font-semibold",
                              selected ? "text-brand" : "text-ink"
                            )}
                          >
                            {option.name}
                          </span>
                          <span className="block text-[0.8125rem] text-ink-tertiary">
                            {option.blurb}
                          </span>
                        </span>
                        {selected && <Check className="size-5 shrink-0 text-brand" aria-hidden />}
                      </button>

                      {/* The follow-up choice appears only for the option that
                          needs one, rather than sitting inert beside the rest. */}
                      {selected && option.id === "template" && (
                        <div className="mt-3 ml-4 flex flex-col gap-2 border-l border-line-subtle pl-4">
                          {serviceTemplates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              aria-pressed={templateId === t.id}
                              onClick={() => setTemplateId(t.id)}
                              className={cn(
                                "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left",
                                "transition-colors duration-(--duration-fast)",
                                "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                                templateId === t.id
                                  ? "border-brand bg-brand-subtle"
                                  : "border-line bg-surface hover:border-line-strong"
                              )}
                            >
                              <span className="min-w-0">
                                <span className="block text-[0.875rem] font-semibold text-ink">
                                  {t.name}
                                </span>
                                <span className="block text-[0.75rem] text-ink-tertiary">
                                  {t.blurb}
                                </span>
                              </span>
                              <Badge variant="outline" size="sm" className="shrink-0">
                                {t.sections.length} sections
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}

                      {selected && option.id === "duplicate" && (
                        <div className="mt-3 ml-4 border-l border-line-subtle pl-4">
                          <label
                            htmlFor="duplicate-source"
                            className="mb-1.5 block text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
                          >
                            Service to clone
                          </label>
                          <select
                            id="duplicate-source"
                            value={sourceId ?? ""}
                            onChange={(e) => setSourceId(e.target.value || null)}
                            className={cn(
                              "h-11 w-full cursor-pointer rounded-xl border border-line bg-surface px-4",
                              "text-[0.875rem] text-ink transition-colors hover:border-line-strong",
                              "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                            )}
                          >
                            <option value="">Select a service…</option>
                            {/* Archived services are excluded — cloning a
                                retired page is never the intent. */}
                            {duplicatable.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} · {s.status}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {startReady && (
                <p className="mt-6 flex items-start gap-2 text-[0.8125rem] text-ink-tertiary">
                  <CircleDashed className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  Starts with{" "}
                  <span className="text-ink-secondary">
                    {startingSections.map((k) => sectionMeta(k).name).join(", ")}
                  </span>
                  .
                </p>
              )}
            </fieldset>
          ) : (
            <fieldset>
              <legend className="sr-only">Service metadata</legend>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-4 flex items-center gap-1.5 rounded-sm text-[0.6875rem] font-bold tracking-widest text-brand uppercase transition-colors hover:text-ion focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to strategy
              </button>

              <h1 className="font-heading text-2xl leading-tight font-bold tracking-tight text-ink">
                Service metadata
              </h1>
              <p className="mt-2 text-ink-tertiary">
                How this service is identified across the site and the portal.
              </p>

              <div className="mt-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="service-name"
                      className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
                    >
                      Service name
                    </label>
                    <Input
                      id="service-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Headless Commerce"
                      className="h-12"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="service-category"
                      className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
                    >
                      Category
                    </label>
                    <select
                      id="service-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                      className={cn(
                        "h-12 w-full cursor-pointer rounded-lg border border-line bg-surface-sunken px-4",
                        "text-[0.875rem] text-ink transition-colors hover:border-line-strong",
                        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                      )}
                    >
                      {serviceCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="service-summary"
                    className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
                  >
                    Short description
                  </label>
                  <Textarea
                    id="service-summary"
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="What this service does, in one sentence."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="service-slug"
                    className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
                  >
                    URL slug
                  </label>
                  <div
                    className={cn(
                      "flex items-center rounded-lg border bg-surface-sunken pr-3 transition-colors",
                      taken ? "border-danger" : "border-line focus-within:border-brand"
                    )}
                  >
                    <span className="shrink-0 py-3 pl-4 text-[0.875rem] text-ink-tertiary">
                      nexus.agency/services/
                    </span>
                    <input
                      id="service-slug"
                      value={effectiveSlug}
                      onChange={(e) => {
                        setSlugEdited(true);
                        setSlug(toSlug(e.target.value));
                      }}
                      aria-invalid={taken}
                      aria-describedby="slug-help"
                      placeholder="new-service"
                      className="min-w-0 flex-1 bg-transparent py-3 font-mono text-[0.875rem] font-semibold text-brand outline-none"
                    />
                    {slugValid && (
                      <Check className="size-4 shrink-0 text-success" aria-hidden />
                    )}
                  </div>
                  <p
                    id="slug-help"
                    className={cn(
                      "text-[0.75rem]",
                      taken ? "font-medium text-danger" : "text-ink-tertiary"
                    )}
                  >
                    {taken
                      ? `“${effectiveSlug}” is already used by another service.`
                      : "Follows the name until you edit it. Lower case, words separated by hyphens."}
                  </p>
                </div>

                {submitted && (
                  <Alert tone="warning">
                    <AlertTitle>Service not created</AlertTitle>
                    <AlertDescription>
                      {/* TODO: POST to the services API, then redirect to the
                          editor for the new service id. */}
                      The services API is not connected yet, so nothing was saved.
                      Your entries are still here.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </fieldset>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface-sunken/50 px-6 py-5 lg:px-10">
          <Button variant="ghost" render={<Link href="/admin/services" />}>
            Cancel
          </Button>

          <div className="flex flex-wrap gap-3">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft />
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button disabled={!startReady} onClick={() => setStep(2)}>
                Continue
                <ArrowRight />
              </Button>
            ) : (
              <Button
                disabled={!metaReady}
                onClick={() => setSubmitted(true)}
                className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
              >
                Create service
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
