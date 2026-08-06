import Link from "next/link";
import { ArrowRight, Check, Quote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BlockKind, PageBlock } from "@/lib/supabase/page-actions";

/**
 * The rendering engine.
 *
 * A published page is a loop over its block tree, and each `kind` maps to one
 * component here. Adding a block type means adding a renderer plus a catalogue
 * entry — never a new route or a new page component, which is the whole point
 * of a CMS.
 *
 * Every renderer reads only from `block.data`, so what an editor types is what
 * the public sees, with no hardcoded copy anywhere in this file.
 */

type Data = Record<string, unknown>;
const str = (d: Data, k: string, fallback = "") =>
  typeof d[k] === "string" ? (d[k] as string) : fallback;
const list = (d: Data, k: string): Data[] =>
  Array.isArray(d[k]) ? (d[k] as Data[]).filter((x) => typeof x === "object" && x !== null) : [];

function Section({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "sunken";
}) {
  return (
    <section
      className={
        tone === "sunken"
          ? "border-y border-line-subtle bg-surface-sunken/50 px-5 py-20 lg:px-10"
          : "px-5 py-20 lg:px-10"
      }
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

function Hero({ data }: { data: Data }) {
  const href = str(data, "ctaHref");
  const label = str(data, "ctaLabel");
  const image = str(data, "imageUrl");

  return (
    <section className="px-5 py-24 lg:px-10">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <div>
          {str(data, "eyebrow") && (
            <Badge variant="brand" className="mb-4">
              {str(data, "eyebrow")}
            </Badge>
          )}
          <h1 className="font-heading text-[2.75rem] leading-[1.1] font-bold tracking-tight text-ink md:text-[3.5rem]">
            {str(data, "heading", "Untitled")}
          </h1>
          {str(data, "body") && (
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-tertiary">
              {str(data, "body")}
            </p>
          )}
          {label && href && (
            <Button size="lg" className="mt-8" render={<Link href={href} />}>
              {label}
              <ArrowRight />
            </Button>
          )}
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- the storage host
          // is configured per deployment, which the CMS cannot know at build time.
          <img
            src={image}
            alt={str(data, "imageAlt")}
            className="w-full rounded-2xl border border-line object-cover shadow-e2"
          />
        )}
      </div>
    </section>
  );
}

function FeatureGrid({ data }: { data: Data }) {
  const items = list(data, "items");
  return (
    <Section tone="sunken">
      {str(data, "heading") && (
        <h2 className="mb-10 font-heading text-3xl font-bold tracking-tight text-ink">
          {str(data, "heading")}
        </h2>
      )}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <li key={i}>
            <Card className="h-full">
              <CardContent className="py-6">
                <h3 className="font-heading text-base font-semibold text-ink">
                  {str(item, "title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-tertiary">
                  {str(item, "body")}
                </p>
                {/* Comma-separated in the editor: one field an author can fill
                    without learning a repeater for two words. */}
                {str(item, "tags") && (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {str(item, "tags")
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <li key={tag}>
                          <Badge variant="outline" size="sm" className="font-mono">
                            {tag}
                          </Badge>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Pricing({ data }: { data: Data }) {
  const items = list(data, "items");
  return (
    <Section>
      {str(data, "heading") && (
        <h2 className="mb-10 text-center font-heading text-3xl font-bold tracking-tight text-ink">
          {str(data, "heading")}
        </h2>
      )}
      <ul className="grid gap-5 md:grid-cols-3">
        {items.map((item, i) => {
          const featured = item.featured === true;
          return (
            <li key={i}>
              <Card className={featured ? "border-brand shadow-e3" : undefined}>
                <CardContent className="flex h-full flex-col py-7">
                  {featured && (
                    <Badge variant="brand" className="mb-3 self-start">
                      {str(item, "badge", "Most popular")}
                    </Badge>
                  )}
                  <h3 className="font-heading text-lg font-semibold text-ink">
                    {str(item, "name")}
                  </h3>
                  <p className="mt-2 font-heading text-3xl font-bold text-ink">
                    {str(item, "price")}
                    {str(item, "interval") && (
                      <span className="text-base font-normal text-ink-tertiary">
                        {" "}
                        / {str(item, "interval")}
                      </span>
                    )}
                  </p>
                  {str(item, "body") && (
                    <p className="mt-2 text-sm text-ink-tertiary">{str(item, "body")}</p>
                  )}
                  <ul className="mt-5 flex flex-col gap-2">
                    {list(item, "features").map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-ink-secondary">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                        {str(f, "label")}
                      </li>
                    ))}
                  </ul>
                  {str(item, "ctaLabel") && str(item, "ctaHref") && (
                    <Button
                      className="mt-6"
                      variant={featured ? "default" : "outline"}
                      render={<Link href={str(item, "ctaHref")} />}
                    >
                      {str(item, "ctaLabel")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Faq({ data }: { data: Data }) {
  const items = list(data, "items");
  return (
    <Section tone="sunken">
      {str(data, "heading") && (
        <h2 className="mb-8 font-heading text-3xl font-bold tracking-tight text-ink">
          {str(data, "heading")}
        </h2>
      )}
      <dl className="flex flex-col gap-6">
        {items.map((item, i) => (
          <div key={i} className="border-b border-line-subtle pb-6 last:border-0">
            <dt className="font-heading text-base font-semibold text-ink">
              {str(item, "question")}
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink-tertiary">
              {str(item, "answer")}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function RichText({ data }: { data: Data }) {
  // Split on blank lines rather than rendering HTML: block content is authored
  // by an editor, and injecting it as markup would be a stored-XSS vector.
  const paragraphs = str(data, "body").split(/\n{2,}/).filter(Boolean);
  return (
    <Section>
      {str(data, "heading") && (
        <h2 className="mb-5 font-heading text-3xl font-bold tracking-tight text-ink">
          {str(data, "heading")}
        </h2>
      )}
      <div className="flex max-w-prose flex-col gap-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="leading-relaxed text-ink-secondary">
            {p}
          </p>
        ))}
      </div>
    </Section>
  );
}

function Testimonials({ data }: { data: Data }) {
  const items = list(data, "items");
  return (
    <Section>
      {str(data, "heading") && (
        <h2 className="mb-10 font-heading text-3xl font-bold tracking-tight text-ink">
          {str(data, "heading")}
        </h2>
      )}
      <ul className="grid gap-5 md:grid-cols-2">
        {items.map((item, i) => (
          <li key={i}>
            <Card className="h-full">
              <CardContent className="py-6">
                <Quote className="mb-3 size-5 text-brand" aria-hidden />
                <blockquote className="text-sm leading-relaxed text-ink-secondary">
                  {str(item, "quote")}
                </blockquote>
                <p className="mt-4 text-sm font-semibold text-ink">{str(item, "name")}</p>
                <p className="text-xs text-ink-tertiary">{str(item, "role")}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Cta({ data }: { data: Data }) {
  return (
    <Section tone="sunken">
      <div className="rounded-2xl border border-brand-line bg-brand-subtle px-8 py-12 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-ink">
          {str(data, "heading", "Ready to start?")}
        </h2>
        {str(data, "body") && (
          <p className="mx-auto mt-3 max-w-prose text-ink-secondary">{str(data, "body")}</p>
        )}
        {str(data, "ctaLabel") && str(data, "ctaHref") && (
          <Button size="lg" className="mt-7" render={<Link href={str(data, "ctaHref")} />}>
            {str(data, "ctaLabel")}
            <ArrowRight />
          </Button>
        )}
      </div>
    </Section>
  );
}


/**
 * Measured outcomes. Each row is a label and a value the author typed — the
 * optional bar is a visual echo of `percent`, never a second source of truth,
 * so a row without one simply has no bar rather than a guessed width.
 */
function Stats({ data }: { data: Data }) {
  const items = list(data, "items");
  return (
    <Section>
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface-raised p-8">
        {str(data, "heading") && (
          <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight text-ink">
            {str(data, "heading")}
          </h2>
        )}
        <dl className="flex flex-col gap-6">
          {items.map((item, i) => {
            const raw = Number(str(item, "percent"));
            const percent = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : null;
            return (
              <div key={i}>
                <div className="flex items-end justify-between gap-4">
                  <dt className="font-mono text-sm text-ink-tertiary">{str(item, "label")}</dt>
                  <dd className="font-heading text-xl font-bold text-ink">{str(item, "value")}</dd>
                </div>
                {percent !== null && (
                  <div
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
                    role="presentation"
                  >
                    <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </dl>
      </div>
    </Section>
  );
}

/** A partner or integration strip. Names, because a logo needs an asset. */
function Logos({ data }: { data: Data }) {
  const items = list(data, "items");
  if (items.length === 0) return <></>;
  return (
    <Section tone="sunken">
      {str(data, "heading") && (
        <p className="mb-8 text-center text-xs font-semibold tracking-widest text-ink-tertiary uppercase">
          {str(data, "heading")}
        </p>
      )}
      <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {items.map((item, i) => (
          <li key={i} className="font-heading text-lg font-bold text-ink-tertiary">
            {str(item, "name")}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * A delivery roadmap. Steps are numbered from their position, so inserting one
 * renumbers the rest automatically rather than leaving an author to renumber
 * by hand and eventually ship two "03"s.
 */
function Timeline({ data }: { data: Data }) {
  const items = list(data, "items");
  return (
    <Section>
      {str(data, "heading") && (
        <h2 className="mb-12 text-center font-heading text-3xl font-bold tracking-tight text-ink">
          {str(data, "heading")}
        </h2>
      )}
      <ol className="mx-auto flex max-w-3xl flex-col gap-8">
        {items.map((item, i) => (
          <li key={i} className="flex gap-5">
            <span className="flex flex-col items-center">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-brand bg-surface font-mono text-sm font-bold text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              {i < items.length - 1 && <span className="mt-1 w-px flex-1 bg-line" aria-hidden />}
            </span>
            <div className="pb-2">
              <h3 className="font-heading text-lg font-semibold text-ink">{str(item, "title")}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-tertiary">{str(item, "body")}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const registry: Record<BlockKind, (p: { data: Data }) => React.ReactElement> = {
  hero: Hero,
  featureGrid: FeatureGrid,
  pricing: Pricing,
  stats: Stats,
  logos: Logos,
  timeline: Timeline,
  faq: Faq,
  richText: RichText,
  testimonials: Testimonials,
  cta: Cta,
};

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks
        // Hidden blocks stay in the version so the editor can restore them,
        // but never reach the public page.
        .filter((b) => b.visible !== false)
        .map((block) => {
          const Component = registry[block.kind];
          // An unknown kind means the version predates a renderer being removed.
          // Skipping is right: a half-rendered page is worse than a shorter one.
          if (!Component) return null;
          return <Component key={block.id} data={block.data ?? {}} />;
        })}
    </>
  );
}
