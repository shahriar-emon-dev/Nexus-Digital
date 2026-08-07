import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listPublishedPackages } from "@/lib/supabase/marketing-actions";
import { toServiceCard } from "./packages-to-cards";
import { ServiceDirectory } from "./ServiceDirectory";

export const metadata: Metadata = {
  title: "Capabilities & Pricing",
  description:
    "Transparent, scalable solutions tailored to your growth stage. Leverage high-performance delivery through our multi-dimensional engagement frameworks.",
};

const comparison = {
  columns: [
    { label: "Retainer (Core)", tone: "text-brand" },
    { label: "Project (Milestone)", tone: "text-ion" },
    { label: "Advisory (Strategic)", tone: "text-chart-4" },
  ],
  rows: [
    {
      feature: "Staffing Model",
      values: [
        "Dedicated squad (fixed capacity)",
        "Flexible specialists (as needed)",
        "Principal strategist (on-call)",
      ],
    },
    {
      feature: "Response Times",
      values: ["< 4 hours (SLA-guaranteed)", "< 24 hours", "< 8 hours"],
    },
    {
      feature: "Strategy Reviews",
      values: ["Bi-weekly syncs", "Per milestone", "Monthly deep-dive"],
    },
    {
      feature: "IP Ownership",
      values: ["Full transfer on payment", "Full transfer on completion", "Usage rights only"],
    },
    {
      feature: "Ideal For",
      values: [
        "Continuous product iteration",
        "Specific brand or product launch",
        "Long-term vision & roadmap",
      ],
    },
  ],
};

export default async function PricingPage() {
  const packages = await listPublishedPackages();
  const services = packages.map(toServiceCard);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-10 md:py-24">
      <section className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 font-heading text-display leading-tight font-bold text-balance text-ink">
          Our Specialized Capabilities &amp; Pricing Models
        </h1>
        <p className="text-lg leading-relaxed text-ink-secondary">
          Transparent, scalable solutions tailored to your growth stage. Leverage
          high-performance delivery through our multi-dimensional engagement frameworks.
        </p>
      </section>

      <ServiceDirectory services={services} />

      <section className="mt-24 flex flex-col gap-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-brand">
            Engagement Model Comparison
          </h2>
          <p className="text-ink-tertiary">
            Analyze the key differences between our collaboration frameworks to find your
            perfect fit.
          </p>
        </div>

        <Card variant="glass" className="overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-sunken hover:bg-surface-sunken">
                <TableHead>Feature</TableHead>
                {comparison.columns.map((col) => (
                  <TableHead key={col.label} className={col.tone}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.rows.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-semibold text-ink">{row.feature}</TableCell>
                  {row.values.map((value, i) => (
                    <TableCell key={comparison.columns[i].label}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
