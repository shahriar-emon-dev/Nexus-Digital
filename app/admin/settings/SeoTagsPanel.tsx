"use client";

import * as React from "react";
import { Code2, Globe, ImageUp, LineChart } from "lucide-react";

import { cn } from "@/lib/utils";
import { ID_PATTERNS as idPatterns, SEO_LIMITS } from "@/lib/derive";
import { updateSiteSettings, type SiteSettings } from "@/lib/supabase/site-settings-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { MediaField } from "@/components/cms/MediaPicker";

export function SeoTagsPanel({ settings }: { settings: SiteSettings }) {
  const toast = useToast();
  const [title, setTitle] = React.useState(settings.default_title ?? "");
  const [description, setDescription] = React.useState(settings.meta_description ?? "");
  const [ogImage, setOgImage] = React.useState(settings.og_image_url ?? "");
  const [ogAlt, setOgAlt] = React.useState(settings.og_image_alt ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const data = new FormData(e.currentTarget);
        data.set("defaultTitle", title);
        data.set("metaDescription", description);
        data.set("ogImage", ogImage);
        const result = await updateSiteSettings(data);
        setSaving(false);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setDirty(false);
        toast.add({ title: "Published to every public page", type: "success" });
      }}
      className="flex flex-col gap-10"
    >
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
              name="ga4MeasurementId"
              defaultValue={settings.ga4_measurement_id ?? ""}
              placeholder="G-XXXXXXXXXX"
              pattern={idPatterns.ga4.pattern}
              onChange={() => setDirty(true)}
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
              name="gtmContainerId"
              defaultValue={settings.gtm_container_id ?? ""}
              placeholder="GTM-XXXXXXX"
              pattern={idPatterns.gtm.pattern}
              onChange={() => setDirty(true)}
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
              {/* Picks from the media library rather than pointing at a CDN URL
                  that expires, which is what the previous hardcoded value did. */}
              {/* Reuses the page builder's picker, so there is one media
                  chooser in the product rather than two that drift apart. */}
              <MediaField
                value={ogImage}
                alt={ogAlt}
                label=""
                onChange={(next) => {
                  setOgImage(next.url);
                  setOgAlt(next.alt);
                  setDirty(true);
                }}
              />
              <input type="hidden" name="ogImageAlt" value={ogAlt} />
              <p className="text-[0.75rem] text-ink-tertiary">
                {ogAlt || "No image description set — add one in the media library."}
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
            name="headerScripts"
            label="Header scripts"
            hint="Injected into <head>. Use for verification tags and stylesheets."
            defaultValue={settings.header_scripts ?? ""}
            rows={5}
            onChange={() => setDirty(true)}
          />
          <ScriptField
            id="body-scripts"
            name="bodyStartScripts"
            label="Body start scripts"
            hint="Injected immediately after <body> opens. Use for noscript fallbacks."
            defaultValue={settings.body_start_scripts ?? ""}
            rows={3}
            onChange={() => setDirty(true)}
          />
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-line-subtle pt-8">
        {dirty && (
          <p aria-live="polite" className="mr-auto max-w-md text-[0.8125rem] text-ink-tertiary">
            Unsaved changes. Saving publishes these tags to every public page
            immediately.
          </p>
        )}
        <Button
          type="submit"
          size="xl"
          disabled={saving}
          className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
        >
          {saving ? "Saving…" : "Save global changes"}
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
  name,
  label,
  hint,
  defaultValue,
  rows,
  onChange,
}: {
  id: string;
  name: string;
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
        name={name}
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
