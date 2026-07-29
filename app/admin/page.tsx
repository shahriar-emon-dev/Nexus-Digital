import type { Metadata } from "next";
import { Bolt, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommandLogs } from "@/components/admin/CommandLogs";
import { RevenueChart } from "@/components/admin/RevenueChart";

export const metadata: Metadata = { title: "Executive Dashboard" };

const health = [
  { label: "On-Time Completion", value: "94%", fill: 94, bar: "bg-chart-1", text: "text-chart-1" },
  { label: "Resource Utilization", value: "78%", fill: 78, bar: "bg-chart-2", text: "text-chart-2" },
  { label: "Client Satisfaction", value: "4.9/5", fill: 98, bar: "bg-chart-3", text: "text-chart-3" },
];

const summary = [
  {
    icon: TrendingUp,
    chip: "bg-ion/10 text-ion",
    title: "Active Pipeline",
    value: "$2,140,000",
    note: "+18% growth from previous quarter",
    featured: false,
  },
  {
    icon: Users,
    chip: "bg-brand/10 text-brand",
    title: "Talent Overhead",
    value: "42 Units",
    note: "3 open roles in High-Performance Labs",
    featured: false,
  },
  {
    icon: Bolt,
    chip: "bg-brand/20 text-brand",
    title: "Agency Velocity",
    value: "High",
    note: "Optimal delivery speed maintained for 12 days",
    featured: true,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 p-5 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.2] font-bold tracking-tight text-ink">
            Executive Dashboard
          </h1>
          <p className="mt-2 text-ink-tertiary">
            Real-time oversight of agency performance and systems.
          </p>
        </div>
        <Button size="lg" className="rounded-lg">
          <ShieldCheck />
          Run System Audit
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card
          variant="glass"
          className="border-beam col-span-12 rounded-2xl p-6 lg:col-span-8"
        >
          <RevenueChart />
        </Card>

        <Card
          variant="glass"
          className="col-span-12 justify-between rounded-2xl p-6 lg:col-span-4"
        >
          <div>
            <h3 className="mb-6 font-heading text-xl font-semibold text-ink">Delivery Health</h3>
            <dl className="flex flex-col gap-4">
              {health.map((row) => (
                <div key={row.label} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <dt className="text-ink-tertiary">{row.label}</dt>
                    <dd data-tabular className={cn("font-bold", row.text)}>
                      {row.value}
                    </dd>
                  </div>
                  {/* Decorative — the figure above carries the value. */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
                    <div
                      className={cn("h-full rounded-full", row.bar)}
                      style={{ width: `${row.fill}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-8 flex items-center gap-3 rounded-xl border border-success-line bg-success-subtle p-4">
            <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
            <span className="text-[0.6875rem] font-bold text-ink">
              No critical blockers reported today
            </span>
          </p>
        </Card>

        {summary.map((item) => (
          <Card
            key={item.title}
            variant="glass"
            className={cn(
              "col-span-12 rounded-2xl p-6 md:col-span-4",
              item.featured && "border-brand/20 bg-brand/5"
            )}
          >
            <div className="mb-4 flex items-center gap-4">
              <span className={cn("grid size-10 place-items-center rounded-full", item.chip)}>
                <item.icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-heading text-base font-bold text-ink">{item.title}</h3>
            </div>
            <p
              data-tabular
              className={cn(
                "font-heading text-[2rem] leading-none font-bold",
                item.featured ? "text-brand" : "text-ink"
              )}
            >
              {item.value}
            </p>
            <p
              className={cn(
                "mt-2 text-[0.8125rem]",
                item.featured ? "text-brand/70" : "text-ink-tertiary"
              )}
            >
              {item.note}
            </p>
          </Card>
        ))}

        <Card variant="glass" className="col-span-12 rounded-2xl p-6">
          <CommandLogs />
        </Card>
      </div>
    </div>
  );
}
