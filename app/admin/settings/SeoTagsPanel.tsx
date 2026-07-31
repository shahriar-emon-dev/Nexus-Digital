"use client";

import * as React from "react";
import { Code2, Globe, ImageUp, LineChart } from "lucide-react";

import { cn } from "@/lib/utils";
import { idPatterns, SEO_LIMITS, siteSettings } from "@/lib/integrations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

export function SeoTagsPanel() {
  const [title, setTitle] = React.useState(siteSettings.defaultTitle);
  const [description, setDescription] = React.useState(siteSettings.metaDescription);
  const [saved, setSaved] = React.useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      className="flex flex-col gap-10"
    >
      {/* ── Analytics ───────────────────────────────────────────────────── */}
      <Section icon={LineChart} title="Analytics and tracking">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card variant="glass" className="gap-3 rounded-2xl p-6">
            <label
              htmlFor="ga4"
              className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
            >
              Google Analytics 4
            </label>
            <Input
              id="ga4"
              name="ga4"
              defaultValue={siteSettings.ga4MeasurementId}
              placeholder="G-XXXXXXXXXX"
              pattern={idPatterns.ga4.pattern}
              onChange={() => setSaved(false)}
              className="font-mono"
            />
            <p className="text-[0.75rem] text-ink-tertiary">{idPatterns.ga4.hint}</p>
          </Card>

          <Card variant="glass" className="gap-3 rounded-2xl p-6">
            <label
              htmlFor="gtm"
              className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
            >
              Google Tag Manager
            </label>
            <Input
              id="gtm"
              name="gtm"
              defaultValue={siteSettings.gtmContainerId}
              placeholder="GTM-XXXXXXX"
              pattern={idPatterns.gtm.pattern}
              onChange={() => setSaved(false)}
              className="font-mono"
            />
            <p className="text-[0.75rem] text-ink-tertiary">{idPatterns.gtm.hint}</p>
          </Card>
        </div>
      </Section>

      {/* ── Meta ────────────────────────────────────────────────────────── */}
      <Section icon={Globe} title="Global meta tags">
        <Card variant="glass" className="gap-8 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Counted
                id="meta-title"
                label="Default title"
                value={title}
                onChange={setTitle}
                limit={SEO_LIMITS.title}
                hint="Shown in the browser tab and as the search result heading."
              />
              <Counted
                id="meta-description"
                label="Meta description"
                value={description}
                onChange={setDescription}
                limit={SEO_LIMITS.description}
                multiline
                hint="Search engines truncate beyond the limit rather than rejecting it."
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                Share image (1200 × 630)
              </span>
              {/* A real button, not a hover-revealed overlay. */}
              <button
                type="button"
                onClick={() => setSaved(false)}
                className={cn(
                  "group relative h-52 overflow-hidden rounded-xl border border-dashed border-line-strong",
                  "transition-colors duration-(--duration-normal) hover:border-brand",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={siteSettings.ogImage}
                  alt={siteSettings.ogImageAlt}
                  className="absolute inset-0 size-full object-cover opacity-60 transition-transform duration-(--duration-deliberate) ease-(--ease-out-quint) group-hover:scale-105"
                />
                <span className="relative z-10 flex size-full flex-col items-center justify-center gap-2 bg-canvas/40">
                  <ImageUp className="size-7 text-brand" aria-hidden />
                  <span className="text-[0.8125rem] font-semibold text-ink">
                    Replace image
                  </span>
                </span>
              </button>
              <p className="text-[0.75rem] text-ink-tertiary">
                {siteSettings.ogImageAlt}
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── Scripts ─────────────────────────────────────────────────────── */}
      <Section icon={Code2} title="Custom script injection">
        <Alert tone="danger">
          <AlertTitle>Anything pasted here runs on every page</AlertTitle>
          <AlertDescription>
            Scripts execute with full access to your visitors&apos; sessions,
            including anything they type. Only paste code from a source you
            control, and review it first — this field is why most tag-manager
            breaches happen.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-6">
          <ScriptField
            id="header-scripts"
            label="Header scripts"
            hint="Injected into <head>. Use for verification tags and stylesheets."
            defaultValue={siteSettings.headerScripts}
            rows={5}
            onChange={() => setSaved(false)}
          />
          <ScriptField
            id="body-scripts"
            label="Body start scripts"
            hint="Injected immediately after <body> opens. Use for noscript fallbacks."
            defaultValue={siteSettings.bodyStartScripts}
            rows={3}
            onChange={() => setSaved(false)}
          />
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-line-subtle pt-8">
        {saved && (
          <p
            aria-live="polite"
            className="mr-auto max-w-md text-[0.8125rem] text-warning"
          >
            {/* TODO: PUT to the settings endpoint. */}
            Not saved — the settings API is not connected yet, so nothing was
            written and no tag was published.
          </p>
        )}
        <Button
          type="submit"
          size="xl"
          className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
        >
          Save global changes
        </Button>
      </div>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Globe;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
        <Icon className="size-5 shrink-0 text-brand" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Length counter that goes amber past the recommended limit rather than
 * blocking. Search engines truncate long values; they do not reject them, so
 * hard-capping the field would be wrong.
 */
function Counted({
  id,
  label,
  value,
  onChange,
  limit,
  hint,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  limit: number;
  hint: string;
  multiline?: boolean;
}) {
  const over = value.length > limit;
  // Branching beats a polymorphic `Field`: Input and Textarea have genuinely
  // different change-event types, and casting between them hides real errors.
  const fieldClass = cn(over && "border-warning");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
        >
          {label}
        </label>
        <span
          data-tabular
          aria-live="polite"
          className={cn(
            "text-[0.6875rem] font-medium",
            over ? "text-warning" : "text-ink-tertiary"
          )}
        >
          {value.length} / {limit}
          {over && <span className="sr-only"> — over the recommended length</span>}
        </span>
      </div>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )}
      <p className="text-[0.75rem] text-ink-tertiary">{hint}</p>
    </div>
  );
}

function ScriptField({
  id,
  label,
  hint,
  defaultValue,
  rows,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  defaultValue: string;
  rows: number;
  onChange: () => void;
}) {
  return (
    <Card variant="glass" className="gap-0 overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-sunken px-4 py-2.5">
        <label htmlFor={id} className="text-[0.8125rem] font-semibold text-ink">
          {label}
        </label>
        <span className="font-mono text-[0.625rem] tracking-widest text-ink-tertiary uppercase">
          HTML
        </span>
      </div>
      <Textarea
        id={id}
        rows={rows}
        defaultValue={defaultValue}
        onChange={onChange}
        spellCheck={false}
        placeholder="<!-- paste tags here -->"
        className="resize-y rounded-none border-0 bg-canvas font-mono text-[0.8125rem] focus-visible:ring-0"
      />
      <p className="border-t border-line-subtle px-4 py-2.5 text-[0.75rem] text-ink-tertiary">
        {hint}
      </p>
    </Card>
  );
}
