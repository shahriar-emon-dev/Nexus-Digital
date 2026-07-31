"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { landingPages, pageStatusTone } from "@/lib/pages";
import { Badge } from "@/components/ui/badge";
import { PageBuilder } from "./PageBuilder";

/**
 * Which page the builder is editing. The design showed a builder with no way to
 * choose what it was building — this strip is that missing control.
 */
export function PagesWorkspace() {
  const [pageId, setPageId] = React.useState(landingPages[0].id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="group"
        aria-label="Select a page to edit"
        className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto border-b border-line px-4 py-3 lg:px-6"
      >
        {landingPages.map((page) => {
          const selected = page.id === pageId;
          return (
            <button
              key={page.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setPageId(page.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2 text-left",
                "transition-[background-color,border-color,transform] duration-(--duration-normal)",
                "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                selected
                  ? "border-brand-line bg-brand-subtle"
                  : "border-line bg-surface-sunken hover:-translate-y-0.5 hover:border-line-strong"
              )}
            >
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-[0.8125rem] font-semibold",
                    selected ? "text-brand" : "text-ink"
                  )}
                >
                  {page.title}
                </span>
                <span className="block truncate font-mono text-[0.6875rem] text-ink-tertiary">
                  /{page.slug}
                </span>
              </span>
              <Badge variant={pageStatusTone[page.status]} size="sm" className="shrink-0">
                {page.status}
              </Badge>
            </button>
          );
        })}
      </div>

      <PageBuilder pageId={pageId} />
    </div>
  );
}
