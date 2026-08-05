import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { listKeywords } from "@/lib/supabase/seo-actions";
import { KeywordsTable } from "./KeywordsTable";

export const metadata: Metadata = { title: "Keywords" };

export default async function AdminKeywordsPage() {
  const supabase = await createClient();
  const [keywords, pagesRes] = await Promise.all([
    listKeywords(),
    supabase.from("pages").select("id, title, slug").order("title"),
  ]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "SEO", href: "/admin/analytics/seo" },
          { label: "Keywords" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Keywords
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          The terms this site is targeting, with their measured positions.
          Movement is the difference between the two most recent readings, so it
          cannot go stale — and a term with no reading shows a dash rather than
          a rank it was never given.
        </p>
      </header>

      <KeywordsTable
        initial={keywords}
        pages={(pagesRes.data ?? []) as { id: string; title: string; slug: string }[]}
      />
    </div>
  );
}
