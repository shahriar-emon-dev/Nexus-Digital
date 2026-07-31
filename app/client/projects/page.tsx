import type { Metadata } from "next";

import { clientAccount, portfolioStats } from "@/lib/client-portal";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ProjectsGrid } from "./ProjectsGrid";

export const metadata: Metadata = { title: "Projects" };

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function ClientProjectsPage() {
  return (
    <>
      <DashboardHeader
        title="Projects"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Projects" }]}
      />

      <div className="flex flex-1 flex-col px-5 py-10 lg:px-10">
        <ProjectsGrid
          heading={
            <div>
              <h2 className="font-heading text-[2.5rem] leading-[1.2] font-bold tracking-tight text-ink md:text-[3rem]">
                {clientAccount.name} Projects
              </h2>
              <p className="mt-2 text-lg text-ink-tertiary">
                Managing the future of digital experience.
              </p>
            </div>
          }
        />
      </div>

      {/* ── Portfolio strip ─────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-line-subtle bg-surface-sunken/50 px-5 py-6 backdrop-blur-md lg:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-8">
          <dl className="flex flex-wrap gap-12">
            {[
              {
                label: "Total Portfolio Value",
                value: money.format(portfolioStats.totalValue),
                tone: "text-brand",
              },
              {
                label: "Active Projects",
                value: String(portfolioStats.activeCount),
                tone: "text-ink",
              },
              {
                label: "Avg. Completion",
                value: `${portfolioStats.avgEfficiency}%`,
                tone: "text-ion",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="mb-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                  {stat.label}
                </dt>
                <dd
                  data-tabular
                  className={`font-heading text-[2rem] leading-none font-semibold ${stat.tone}`}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center gap-4 text-ink-tertiary">
            <span className="flex items-center gap-2">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-70 motion-reduce:animate-none" />
                <span className="relative size-2 rounded-full bg-brand" />
              </span>
              Network Stable
            </span>
            <span className="h-4 w-px bg-line" aria-hidden />
            <span>Last updated 14:32 UTC</span>
          </div>
        </div>
      </footer>
    </>
  );
}
