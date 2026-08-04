"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Pencil, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { PageRecord, PageStatus } from "@/lib/supabase/page-actions";

const tone: Record<PageStatus, "success" | "warning" | "info" | "default"> = {
  published: "success",
  draft: "warning",
  scheduled: "info",
  unpublished: "default",
  archived: "default",
};

export function PagesTable({ initialPages }: { initialPages: PageRecord[] }) {
  const router = useRouter();
  const [pages, setPages] = React.useState(initialPages);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => setPages(initialPages), [initialPages]);

  /** Targeted subscription so a publish in another tab is reflected here. */
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin:pages")
      .on("postgres_changes", { event: "*", schema: "public", table: "pages" }, () =>
        router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const visible = pages.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  // Counts are reduced from the rows on screen, so they cannot disagree with them.
  const live = pages.filter((p) => p.status === "published").length;
  const drafts = pages.filter((p) => p.status === "draft").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-tertiary">
          {live} live · {drafts} draft{drafts === 1 ? "" : "s"} · {pages.length} total
        </p>
        <Button size="sm" render={<Link href="/admin/content/pages/new" />}>
          <Plus />
          Create new page
        </Button>
      </div>

      {pages.length > 0 && (
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or URL…"
            aria-label="Search pages"
            className="pl-9"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={pages.length === 0 ? "No pages yet" : "No matches"}
          description={
            pages.length === 0
              ? "Create your first page and publish it to a live URL."
              : "No page matches that search."
          }
          action={
            pages.length === 0 ? (
              <Button size="sm" render={<Link href="/admin/content/pages/new" />}>
                <Plus />
                Create a page
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <caption className="sr-only">Every page, with its status and URL.</caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Page
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Updated
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-surface-sunken/40">
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <span className="block text-sm font-semibold text-ink">{p.title}</span>
                        <code className="block font-mono text-xs text-ink-tertiary">/{p.slug}</code>
                      </th>
                      <td className="px-3 py-3">
                        <Badge variant={tone[p.status]}>{p.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-sm text-ink-tertiary">
                        {new Date(p.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="flex justify-end gap-1">
                          {p.status === "published" && (
                            <Button
                              variant="ghost"
                              size="xs"
                              render={<Link href={`/${p.slug}`} target="_blank" />}
                            >
                              <ExternalLink />
                              View
                              <span className="sr-only"> (opens in a new tab)</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="xs"
                            render={<Link href={`/admin/content/pages/${p.id}`} />}
                          >
                            <Pencil />
                            Edit
                          </Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
