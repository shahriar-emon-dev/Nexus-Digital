import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb, Quote } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Block } from "@/lib/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const statTone = { brand: "text-brand", ion: "text-ion", ink: "text-ink" } as const;

/**
 * Minimal, deterministic tokeniser for the code sample — comments, strings and
 * keywords only. Builds React nodes rather than injecting HTML, so nothing in
 * the content can execute. Enough to match the design's colouring without
 * pulling in a syntax-highlighting dependency.
 */
const KEYWORDS =
  /\b(import|from|export|function|const|let|return|type|interface|await|async|new)\b/;
const TOKEN = new RegExp(
  [
    "(\\/\\/[^\\n]*)", // line comment
    "('[^']*'|\"[^\"]*\"|`[^`]*`)", // string / template
    KEYWORDS.source,
  ].join("|"),
  "g"
);

function highlight(code: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(code)) !== null) {
    if (match.index > last) out.push(code.slice(last, match.index));
    const [text, comment, str] = match;
    const className = comment
      ? "text-ink-tertiary italic"
      : str
        ? "text-chart-3"
        : "text-ion";
    out.push(
      <span key={key++} className={className}>
        {text}
      </span>
    );
    last = match.index + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex max-w-prose flex-col gap-8">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "section":
            return (
              <h2
                key={block.id}
                id={block.id}
                className="scroll-mt-32 font-heading text-[2rem] leading-[1.3] font-semibold text-ink"
              >
                {block.heading}
              </h2>
            );

          case "p":
            return (
              <p key={i} className="text-lg leading-relaxed text-ink-tertiary">
                {block.text}
              </p>
            );

          case "quote":
            return (
              <figure
                key={i}
                className="relative overflow-hidden rounded-r-2xl border-l-4 border-brand bg-brand/5 px-10 py-8"
              >
                <Quote
                  className="pointer-events-none absolute -top-2 -left-2 size-24 text-brand/10"
                  aria-hidden
                />
                <blockquote className="relative mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-ink italic">
                  &ldquo;{block.text}&rdquo;
                </blockquote>
                <figcaption className="text-[0.8125rem] font-bold text-brand">
                  — {block.cite}
                </figcaption>
              </figure>
            );

          case "code":
            return (
              <Card key={i} variant="glass" className="overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-line-subtle bg-surface-sunken px-6 py-3">
                  <span className="font-mono text-xs text-ink-tertiary">
                    {block.filename} — {block.language}
                  </span>
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="size-3 rounded-full bg-danger/25" />
                    <span className="size-3 rounded-full bg-warning/25" />
                    <span className="size-3 rounded-full bg-success/25" />
                  </span>
                </div>
                <pre
                  tabIndex={0}
                  aria-label={`Code sample: ${block.filename}`}
                  className="overflow-x-auto p-6 text-sm leading-relaxed text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                >
                  <code className="font-mono">{highlight(block.code)}</code>
                </pre>
              </Card>
            );

          case "callout":
            return (
              <div
                key={i}
                className="flex items-start gap-5 rounded-2xl border border-ion/30 bg-ion/5 p-6"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ion/20">
                  <Lightbulb className="size-5 text-ion" aria-hidden />
                </span>
                <div>
                  <h3 className="mb-1 font-bold text-ink">{block.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-tertiary">{block.body}</p>
                </div>
              </div>
            );

          case "stats":
            return (
              <dl key={i} className="my-2 grid grid-cols-2 gap-6 md:grid-cols-3">
                {block.items.map((stat, j) => (
                  <Card
                    key={stat.label}
                    variant="glass"
                    className={cn(
                      "items-center rounded-2xl p-6 text-center",
                      j === 2 && "col-span-2 md:col-span-1"
                    )}
                  >
                    <dd
                      data-tabular
                      className={cn(
                        "mb-1 font-heading text-3xl font-bold",
                        statTone[stat.tone]
                      )}
                    >
                      {stat.value}
                    </dd>
                    <dt className="text-xs font-semibold tracking-widest text-ink-tertiary uppercase">
                      {stat.label}
                    </dt>
                  </Card>
                ))}
              </dl>
            );

          case "cta":
            return (
              <div
                key={i}
                className="border-beam my-8 overflow-hidden rounded-3xl p-px"
              >
                <Card
                  variant="glass"
                  className="items-center rounded-[calc(1.5rem-1px)] p-10 text-center"
                >
                  <h2 className="mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                    {block.heading}
                  </h2>
                  <p className="mb-8 max-w-112 text-ink-tertiary">{block.body}</p>
                  <Button
                    size="xl"
                    className="rounded-full"
                    render={<Link href={block.href} />}
                  >
                    {block.label}
                    <ArrowRight />
                  </Button>
                </Card>
              </div>
            );
        }
      })}
    </div>
  );
}
