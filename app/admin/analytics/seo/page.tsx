import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileWarning, Globe, Target, TrendingUp } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { keywordSummaryFrom } from "@/lib/derive";
import { getSeoCoverage, listKeywords } from "@/lib/supabase/seo-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "SEO Overview" };

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });

/**
 * SEO Overview, restricted to what can be computed.
 *
 * The previous screen reported 2.4M impressions, 87.6K clicks, a 3.69% organic
 * CTR and four trend deltas, none of which had a source — this application is
 * not connected to Search Console, so none of those numbers could exist. What
 * it CAN measure is its own content: keyword positions the team records, and
 * the metadata completeness of every page this CMS owns.
 */
export default async function AdminSeoPage() {
  const [keywords, coverage] = await Promise.all([listKeywords(), getSeoCoverage()]);
  const summary = keywordSummaryFrom(keywords);

  const metadataGaps = coverage.missingTitle + coverage.missingDescription;
  const movers = keywords
    .filter((k) => k.movement !== null && k.movement !== 0)
    .sort((a, b) => Math.abs(b.movement ?? 0) - Math.abs(a.movement ?? 0))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[{ label: "Command Center", href: "/admin" }, { label: "SEO Overview" }]}
      />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            SEO Overview
          </h1>
          <p className="mt-2 max-w-2xl text-ink-tertiary">
            Rankings the team records, and the metadata completeness of every
            page this CMS owns.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/admin/analytics/keywords" />}>
          Manage keywords
          <ArrowRight />
        </Button>
      </header>

      {/* Stated once, plainly, instead of filling the screen with numbers that
          would need a source this deployment does not have. */}
      <Alert tone="info">
        <AlertTitle>Impressions, clicks and CTR are not shown</AlertTitle>
        <AlertDescription>
          Those come from Google Search Console, which is not connected to this
          deployment. Connecting it would let this screen report search
          performance; until then it reports only what it can measure, rather
          than an estimate that would be indistinguishable from a real figure.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Keywords tracked" value={String(summary.tracked)} icon={Target} />
        <StatCard
          label="Average position"
          value={summary.averagePosition === null ? "—" : String(summary.averagePosition)}
          caption={
            summary.averagePosition === null
              ? "Nothing measured yet"
              : `Across ${summary.measured} measured`
          }
          icon={TrendingUp}
        />
        <StatCard
          label="In the top ten"
          value={String(summary.topTen)}
          caption={summary.measured > 0 ? `of ${summary.measured} measured` : undefined}
        />
        <StatCard
          label="Pages published"
          value={String(coverage.published)}
          caption={`${coverage.totalPages} total`}
          icon={Globe}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* -------------------------------------------------- metadata gaps -- */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata coverage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {coverage.totalPages === 0 ? (
              <p className="text-sm text-ink-tertiary">
                No pages exist yet, so there is nothing to check.
              </p>
            ) : metadataGaps === 0 ? (
              <p className="text-sm text-success">Every page has a title and description.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                <Gap
                  label="Pages with no SEO title"
                  count={coverage.missingTitle}
                  total={coverage.totalPages}
                />
                <Gap
                  label="Pages with no meta description"
                  count={coverage.missingDescription}
                  total={coverage.totalPages}
                />
                <Gap
                  label="Keywords with no target page"
                  count={coverage.keywordsWithoutTarget}
                  total={summary.tracked}
                />
              </ul>
            )}

            <Button
              variant="outline"
              size="sm"
              className="self-start"
              render={<Link href="/admin/content/pages" />}
            >
              Open the page list
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>

        {/* --------------------------------------------------------- movers -- */}
        <Card>
          <CardHeader>
            <CardTitle>Biggest movers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {movers.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={FileWarning}
                  title="No movement recorded"
                  description="Movement needs at least two position readings for the same keyword. Record a second one to see change."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {movers.map((k) => (
                  <li key={k.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{k.term}</span>
                      <span className="block text-xs text-ink-tertiary">
                        Now #{k.position}
                        {k.measuredOn ? `, measured ${dayFmt.format(new Date(k.measuredOn))}` : ""}
                      </span>
                    </span>
                    <Badge variant={(k.movement ?? 0) > 0 ? "success" : "danger"} size="sm">
                      {(k.movement ?? 0) > 0 ? "+" : "−"}
                      {Math.abs(k.movement ?? 0)}
                      <span className="sr-only">
                        {(k.movement ?? 0) > 0 ? " places improved" : " places lost"}
                      </span>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Gap({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink">{label}</span>
        <span data-tabular className={cn("text-sm", count > 0 ? "text-warning" : "text-success")}>
          {count} of {total}
        </span>
      </div>
      <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <span
          className={cn("block h-full rounded-full", count > 0 ? "bg-warning" : "bg-success")}
          style={{ width: `${count > 0 ? pct : 100}%` }}
        />
      </span>
    </li>
  );
}
