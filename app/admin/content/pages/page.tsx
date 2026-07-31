import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { pageStats } from "@/lib/pages";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PagesWorkspace } from "./PagesWorkspace";

export const metadata: Metadata = { title: "Landing Pages" };

export default function AdminPagesPage() {
  return (
    // One viewport tall from `lg`, so the outline and the canvas scroll
    // independently and the toolbar stays put.
    <div className="flex min-h-0 flex-1 flex-col lg:h-[calc(100svh-5rem)] lg:flex-none lg:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-4 pt-6 pb-4 lg:px-6">
        <div>
          <Breadcrumbs
            items={[
              { label: "Command Center", href: "/admin" },
              { label: "CMS", href: "/admin/content/blog" },
              { label: "Landing Pages" },
            ]}
          />
          <h1 className="font-heading text-[2rem] leading-tight font-bold tracking-tight text-ink">
            Landing Page Engine
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
            {/* Derived — the design hardcoded "14 Pages Live". */}
            <span data-tabular>{pageStats.live}</span> live ·{" "}
            <span data-tabular>{pageStats.drafts}</span> draft ·{" "}
            <span data-tabular>{pageStats.inMainNav}</span> in the main navigation
          </p>
        </div>

        <Button
          render={<Link href="/admin/content/pages/new" />}
          className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
        >
          <Plus />
          Create new page
        </Button>
      </div>

      <PagesWorkspace />
    </div>
  );
}
