import type { Metadata } from "next";

import { keywords, seoProperties, trackedKeywordCount } from "@/lib/seo";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { KeywordsTable } from "./KeywordsTable";

export const metadata: Metadata = { title: "Keyword Intelligence" };

export default function AdminKeywordsPage() {
  const property = seoProperties[0];
  const avgDifficulty = Math.round(
    keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length
  );
  const topTen = keywords.filter((k) => k.position <= 10).length;

  return (
    <>
      

      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <Breadcrumbs items={[
          { label: "Command Center", href: "/admin" },
          { label: "Analytics", href: "/admin/analytics" },
          { label: "Keywords" },
        ]} />
        <header>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Keyword Intelligence
          </h1>
          <p className="mt-2 max-w-xl text-ink-tertiary">
            Rank tracking across{" "}
            <span data-tabular>{trackedKeywordCount}</span> targets on{" "}
            {property.domain} —{" "}
            <span data-tabular>{topTen}</span> currently in the top ten, average
            difficulty <span data-tabular>{avgDifficulty}%</span>.
          </p>
        </header>

        <KeywordsTable domain={property.domain} />
      </div>
    </>
  );
}
