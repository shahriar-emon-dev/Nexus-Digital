import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BarSeries, ColumnSeries, StatusBars } from "@/components/admin/BarSeries";
import { getAnalytics } from "@/lib/supabase/analytics-queries";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Business analytics",
  description: "Revenue, pipeline, delivery and utilisation, counted from the database.",
};

export const dynamic = "force-dynamic";

/**
 * The business analytics dashboard.
 *
 * Spec §12.1 lists eight charts and none existed — `/admin/analytics`
 * redirected straight to the SEO overview, so the only measured figures in the
 * product were four cards on the landing page.
 *
 * Every series is counted or derived. Where a number would be misleading it is
 * withheld: collection rate is null rather than 0% when nothing has been
 * billed, and a series with no rows renders a sentence instead of a flat line.
 *
 * Web traffic (spec §12.3) is deliberately absent. This application cannot see
 * it, and a "visitors" figure synthesised from row counts would be a fabricated
 * metric on a page whose whole purpose is measurement.
 */
export default async function AdminAnalyticsOverviewPage() {
  const a = await getAnalytics(12);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Analytics", href: "/admin/analytics/seo" },
          { label: "Business" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Business analytics
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Counted from the database on every load. Nothing here is estimated,
          and a figure with no data behind it says so rather than showing zero.
        </p>
      </header>

      {/* Headline numbers are stat tiles, not one-bar charts. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Collected" value={money.format(a.collection.collected)} />
        <Tile label="Outstanding" value={money.format(a.collection.outstanding)} />
        <Tile
          label="Collection rate"
          value={a.collection.rate === null ? "—" : `${a.collection.rate}%`}
          note={a.collection.rate === null ? "Nothing billed yet" : `of ${money.format(a.collection.billed)} billed`}
        />
        <Tile label="Client accounts" value={String(a.totals.clients)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Revenue collected"
          note="Payments received per month, excluding voided invoices."
        >
          <ColumnSeries
            data={a.revenueByMonth}
            format={(n) => money.format(n)}
            emptyLabel="No payments recorded in the last 12 months."
          />
        </Panel>

        <Panel title="Client growth" note="New client accounts per month.">
          <ColumnSeries data={a.clientsByMonth} emptyLabel="No client accounts created yet." />
        </Panel>

        <Panel
          title="Lead funnel"
          note="Enquiries by stage. Lost leads are excluded — the funnel measures progression."
        >
          <BarSeries
            data={a.leadFunnel}
            tone="chart-2"
            emptyLabel="No enquiries have come in yet."
          />
        </Panel>

        <Panel title="Project status" note="Every engagement, by state.">
          <BarSeries
            data={a.projectStatus}
            tone="chart-3"
            emptyLabel="No projects have been created yet."
          />
        </Panel>

        <Panel
          title="Account health"
          note="Set on the client record. Colour carries the state; the label repeats it."
        >
          <StatusBars data={a.accountHealth} />
        </Panel>

        <Panel
          title="Staff utilisation"
          note="Hours logged against hours committed on project assignments. Anyone with no commitment is omitted rather than shown at zero."
        >
          <BarSeries
            data={a.staffUtilisation}
            tone="chart-4"
            suffix="%"
            emptyLabel="Nobody has both an assignment and logged time yet."
          />
        </Panel>

        <Panel
          title="Review ratings"
          note={`${a.totals.reviews} approved ${a.totals.reviews === 1 ? "review" : "reviews"}.`}
        >
          <BarSeries
            data={a.ratingDistribution}
            tone="brand"
            emptyLabel="No approved reviews yet."
          />
        </Panel>

        <Panel
          title="Web traffic"
          note="Not measured by this application."
        >
          <div className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-sm text-ink-tertiary">
            <p>
              Visitor counts, sources and landing-page performance live in your
              analytics provider, not in this database. A figure invented here
              would be indistinguishable from a measured one, which is the
              failure mode this page exists to avoid.
            </p>
            <p className="mt-3">
              The GA4 measurement id is configurable under{" "}
              <Link href="/admin/settings" className="text-brand hover:underline">
                Settings
              </Link>
              . It is stored but not yet emitted — see the note there.
              <ExternalLink className="ml-1 inline size-3.5" aria-hidden />
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card variant="glass" className="gap-1 rounded-2xl p-5">
      <span className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
        {label}
      </span>
      {/* Proportional figures, not tabular: equal-width digits read loose at
          display sizes and these do not align in a column. */}
      <span className="font-heading text-[1.75rem] leading-none font-bold text-ink">{value}</span>
      {note && <span className="mt-1 text-xs text-ink-tertiary">{note}</span>}
    </Card>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="glass" className="gap-4 rounded-2xl p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
        {note && <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">{note}</p>}
      </div>
      {children}
    </Card>
  );
}
