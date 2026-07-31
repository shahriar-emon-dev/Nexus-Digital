import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { serviceStats } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ServicesTable } from "./ServicesTable";

export const metadata: Metadata = { title: "Services" };

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
});

export default function AdminServicesPage() {
  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[{ label: "Command Center", href: "/admin" }, { label: "Services" }]}
      />

      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Services Catalog
          </h1>
          <p className="mt-2 max-w-xl text-ink-tertiary">
            Everything the agency sells, and the pages that describe it.
          </p>
        </div>

        <Button
          render={<Link href="/admin/services/new" />}
          className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
        >
          <Plus />
          Create service
        </Button>
      </header>

      {/* Every figure derived from the catalogue. */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total services", value: String(serviceStats.total), tone: "text-ink" },
          { label: "Published", value: String(serviceStats.published), tone: "text-success" },
          { label: "Drafts", value: String(serviceStats.drafts), tone: "text-warning" },
          {
            label: "Active engagements",
            value: String(serviceStats.activeProjects),
            tone: "text-brand",
          },
        ].map((stat) => (
          <Card key={stat.label} variant="glass" lift className="gap-1 rounded-2xl p-5">
            <p className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
              {stat.label}
            </p>
            <p
              data-tabular
              className={`font-heading text-[2rem] leading-none font-bold ${stat.tone}`}
            >
              {stat.value}
            </p>
          </Card>
        ))}
      </section>

      <ServicesTable />

      <p className="text-[0.8125rem] text-ink-tertiary">
        Engagements start from{" "}
        <span data-tabular className="font-semibold text-ink">
          {money.format(serviceStats.fromPriceLow)}
        </span>
        .
      </p>
    </div>
  );
}
