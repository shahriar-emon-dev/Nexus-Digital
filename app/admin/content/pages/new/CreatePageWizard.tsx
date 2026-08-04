"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LayoutTemplate, Loader2, Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { createPage, type PageTemplate } from "@/lib/supabase/page-actions";
import { cn } from "@/lib/utils";

/**
 * Create a page.
 *
 * This screen previously rendered three template pictures and reported "Draft
 * not created — the pages API is not connected yet". It now writes a real page
 * and a real draft, instantiates the chosen template's blocks, and lands on the
 * editor. Nothing here reports success it did not achieve.
 */

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/^-|-$/g, "");

export function CreatePageWizard({ templates }: { templates: PageTemplate[] }) {
  const router = useRouter();

  const [templateId, setTemplateId] = React.useState(templates[0]?.id ?? "blank");
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // The slug tracks the title until the author edits it themselves.
  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const valid = title.trim().length > 0 && /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(slug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);

    const data = new FormData();
    data.set("title", title.trim());
    data.set("slug", slug);
    data.set("templateId", templateId);

    const result = await createPage(data);

    if ("error" in result) {
      setBusy(false);
      setError(result.error);
      return;
    }
    // Straight into the editor; the draft already exists in the database.
    router.push(`/admin/content/pages/${result.id}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset>
        <legend className="mb-1 font-heading text-lg font-semibold text-ink">
          Choose a starting point
        </legend>
        <p className="mb-5 text-sm text-ink-tertiary">
          The template&rsquo;s blocks are copied into your page. Editing the template
          later will not change pages already built from it.
        </p>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const selected = templateId === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  aria-pressed={selected}
                  className={cn(
                    "w-full rounded-2xl border p-5 text-left transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                    selected ? "border-brand bg-brand-subtle" : "border-line hover:border-brand-line"
                  )}
                >
                  <span className="mb-3 flex items-center justify-between">
                    <LayoutTemplate className="size-5 text-brand" aria-hidden />
                    {selected && <Check className="size-4 text-brand" aria-hidden />}
                  </span>
                  <span className="block font-heading text-base font-semibold text-ink">
                    {t.name}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-tertiary">
                    {t.description}
                  </span>
                  {/* The real block count, read from the template row — not a
                      decorative "850 used" figure. */}
                  <span className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" size="sm">
                      {t.blocks.length} block{t.blocks.length === 1 ? "" : "s"}
                    </Badge>
                    <Badge size="sm">{t.category}</Badge>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <Card>
        <CardContent className="grid gap-5 py-6 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Page title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer Sale 2026"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">URL</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="promo/summer-sale"
              aria-describedby="slug-help"
            />
            <p id="slug-help" className="text-xs text-ink-tertiary">
              {slug ? (
                <>
                  Will publish at <code className="font-mono text-ink-secondary">/{slug}</code>
                </>
              ) : (
                "Lowercase letters, numbers, hyphens and slashes."
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          <ArrowLeft />
          Back
        </Button>
        <Button type="submit" disabled={!valid || busy}>
          {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Sparkles />}
          {busy ? "Creating…" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
