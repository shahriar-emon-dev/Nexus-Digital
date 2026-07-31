"use client";

import * as React from "react";
import Link from "next/link";
import {
  Blocks,
  BrainCircuit,
  CheckCircle2,
  DraftingCompass,
  LineChart,
  PlusCircle,
  Rocket,
  Search,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputGroup } from "@/components/ui/input";
import { Spotlight } from "@/components/marketing/Spotlight";

type Category = "Core" | "Specialized" | "Emerging" | "Strategy";
/**
 * Engagement models match the comparison table below the grid, plus
 * Performance. The source's filter offered four models but its cards carried
 * five different labels, so "Hourly" work was unreachable by any filter.
 */
type Model = "Retainer" | "Project" | "Advisory" | "Performance";

type Service = {
  slug: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  category: Category;
  model: Model;
  /** How the model is worded on the card, which is not always the model name. */
  modelLabel: string;
  price: string;
  features: string[];
};

const accents: Record<Category, { chip: string; icon: string; badge: string }> = {
  Core: { chip: "bg-brand/10", icon: "text-brand", badge: "border-brand/30 bg-brand-subtle text-brand-subtle-fg" },
  Specialized: { chip: "bg-ion/10", icon: "text-ion", badge: "border-ion/30 bg-ion-subtle text-ion-subtle-fg" },
  Emerging: {
    chip: "bg-chart-3/10",
    icon: "text-chart-3",
    badge: "border-chart-3/30 bg-chart-3-subtle text-chart-3-subtle-fg",
  },
  Strategy: {
    chip: "bg-chart-4/10",
    icon: "text-chart-4",
    badge: "border-chart-4/30 bg-chart-4-subtle text-chart-4-subtle-fg",
  },
};

const services: Service[] = [
  {
    slug: "systems-design",
    title: "Systems Design",
    blurb:
      "Scalable cloud-native architectures optimized for high-concurrency enterprise workloads.",
    icon: DraftingCompass,
    category: "Core",
    model: "Retainer",
    modelLabel: "Retainer",
    price: "From $3,500/mo",
    features: ["Microservices Mapping", "Multi-Cloud Scaling", "Auto-DevOps CI/CD"],
  },
  {
    slug: "neural-ux-strategy",
    title: "Neural UX Strategy",
    blurb:
      "AI-driven user behavior analysis and predictive interface design for conversion mastery.",
    icon: BrainCircuit,
    category: "Specialized",
    model: "Project",
    modelLabel: "Project-Based",
    price: "From $12,000",
    features: ["Biometric Eye-Tracking", "Predictive Heatmaps", "Dynamic Persona A/B"],
  },
  {
    slug: "web3-integration",
    title: "Web3 Integration",
    blurb:
      "Decentralized protocols, smart contract auditing, and tokenomic ecosystem development.",
    icon: Blocks,
    category: "Emerging",
    model: "Retainer",
    modelLabel: "Package",
    price: "From $5,000/mo",
    features: ["Smart Contract Dev", "Wallet Connect Auth", "Governance Design"],
  },
  {
    slug: "market-intelligence",
    title: "Market Intelligence",
    blurb: "Data-driven competitive landscapes and growth modeling for series B+ ventures.",
    icon: LineChart,
    category: "Strategy",
    model: "Advisory",
    modelLabel: "Hourly",
    price: "$350/hr",
    features: ["Trend Forecasting", "Competitive Audit", "Exit Optimization"],
  },
  {
    slug: "growth-acceleration",
    title: "Growth Acceleration",
    blurb:
      "Full-funnel optimization and viral loop engineering to maximize LTV and minimize CAC.",
    icon: Rocket,
    category: "Core",
    model: "Performance",
    modelLabel: "Performance",
    price: "Base + 5% Rev",
    features: ["Viral Factor Design", "Retention Loops", "Scalable Acquisition"],
  },
];

const categories: (Category | "All")[] = ["All", "Core", "Specialized", "Emerging", "Strategy"];
const models: (Model | "All")[] = ["All", "Retainer", "Project", "Advisory", "Performance"];

export function ServiceDirectory() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Category | "All">("All");
  const [model, setModel] = React.useState<Model | "All">("All");

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (category !== "All" && s.category !== category) return false;
      if (model !== "All" && s.model !== model) return false;
      if (!q) return true;
      return `${s.title} ${s.blurb} ${s.features.join(" ")}`.toLowerCase().includes(q);
    });
  }, [query, category, model]);

  return (
    <>
      {/* Filters. All three were inert in the source; they filter here. */}
      <section className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="flex flex-1 flex-col gap-6">
          <InputGroup
            className="h-12 max-w-md rounded-xl"
            leading={<Search />}
            placeholder="Search capabilities…"
            aria-label="Search capabilities"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-3">
            {categories.map((c) => {
              const selected = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full px-5 py-2 text-[0.8125rem] font-semibold tracking-[0.05em] transition-colors duration-(--duration-fast)",
                    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                    selected
                      ? "bg-brand text-brand-fg"
                      : "border border-line-strong bg-surface-sunken text-ink-tertiary hover:border-brand-line hover:text-ink"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0">
          <p
            id="model-label"
            className="mb-4 text-[0.8125rem] font-semibold tracking-widest text-ink-tertiary uppercase"
          >
            Pricing Model
          </p>
          <div
            role="group"
            aria-labelledby="model-label"
            className="inline-flex flex-wrap gap-1 rounded-xl border border-line-strong bg-surface-sunken p-1"
          >
            {models.map((m) => {
              const selected = model === m;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setModel(m)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[0.8125rem] transition-colors duration-(--duration-fast)",
                    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                    selected
                      ? "bg-brand-subtle font-bold text-brand-subtle-fg"
                      : "font-medium text-ink-tertiary hover:text-ink"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <p aria-live="polite" className="sr-only">
        Showing {shown.length} of {services.length} capabilities.
      </p>

      <section className="mb-24 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((service) => {
          const accent = accents[service.category];
          return (
            <Spotlight key={service.slug} className="h-full rounded-2xl">
              <Card
                variant="glass"
                interactive
                className="group relative h-full overflow-hidden rounded-2xl p-8"
              >
                <Badge
                  className={cn(
                    "absolute top-4 right-4 tracking-widest uppercase",
                    accent.badge
                  )}
                  size="sm"
                >
                  {service.category}
                </Badge>

                <span
                  className={cn(
                    "mb-6 grid size-14 place-items-center rounded-xl transition-transform duration-(--duration-normal) group-hover:scale-110",
                    accent.chip
                  )}
                >
                  <service.icon className={cn("size-7", accent.icon)} aria-hidden />
                </span>

                <h3 className="mb-2 font-heading text-[1.75rem] leading-[1.3] font-semibold text-ink">
                  {service.title}
                </h3>
                <p className="mb-6 flex-1 leading-relaxed text-ink-tertiary">{service.blurb}</p>

                <p className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-surface-sunken px-3 py-1 text-[0.8125rem] font-medium text-ink-secondary">
                    {service.modelLabel}
                  </span>
                  <span data-tabular className="font-bold text-brand">
                    {service.price}
                  </span>
                </p>

                <ul className="mb-8 flex flex-col gap-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckCircle2
                        className={cn("size-4 shrink-0", accent.icon)}
                        aria-hidden
                      />
                      <span className="text-ink-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    render={<Link href={`/services/${service.slug}`} />}
                  >
                    View Details
                  </Button>
                  <Button className="flex-1" render={<Link href="/book-meeting" />}>
                    Book This Service
                  </Button>
                </div>
              </Card>
            </Spotlight>
          );
        })}

        {/* Always last, and only when the filters have not narrowed the grid —
            an "add your own" tile beside a single filtered result reads as a
            missing result rather than an invitation. */}
        {category === "All" && model === "All" && !query.trim() && (
          <Card
            variant="glass"
            className="h-full items-center justify-center rounded-2xl border-dashed p-8 text-center"
          >
            <span className="mb-4 grid size-16 place-items-center rounded-full border-2 border-dashed border-line-strong bg-surface-sunken">
              <PlusCircle className="size-6 text-ink-tertiary" aria-hidden />
            </span>
            <h3 className="mb-2 font-heading text-[1.75rem] leading-[1.3] font-semibold text-ink">
              Custom Package
            </h3>
            <p className="text-ink-tertiary">
              Need a combination of services or a bespoke delivery model?
            </p>
            <Button
              variant="outline"
              className="mt-8 w-full py-4"
              render={<Link href="/contact" />}
            >
              Inquire Now
            </Button>
          </Card>
        )}

        {shown.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center text-ink-tertiary">
            No capabilities match those filters.{" "}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
                setModel("All");
              }}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          </p>
        )}
      </section>
    </>
  );
}
