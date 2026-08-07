import * as React from "react";
import type { Metadata } from "next";
import { Briefcase, ShieldCheck, TrendingUp, Users, Wallet, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { getAdminDashboard } from "@/lib/supabase/dashboard-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AccessDeniedNotice } from "@/components/admin/AccessDeniedNotice";
import { CommandLogs } from "@/components/admin/CommandLogs";
import { RevenueChart } from "@/components/admin/RevenueChart";

export const metadata: Metadata = { title: "Executive Dashboard" };

/** Named on the server, resolved to a component here. */
const summaryIcons: Record<string, LucideIcon> = {
  pipeline: TrendingUp,
  people: Users,
  projects: Briefcase,
  revenue: Wallet,
};

export default async function AdminDashboardPage() {
  const { summary, health } = await getAdminDashboard();

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 p-5 lg:p-10">
      <AccessDeniedNotice />
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
                <div
                  key={row.label}
                  className="flex flex-wrap justify-between gap-x-3 text-xs"
                >
                  <dt className="text-ink-tertiary">{row.label}</dt>
                  <dd data-tabular className="font-bold text-ink">
                    {row.display}
                  </dd>
                  {/* Decorative — the figure above carries the value. A null
                      percentage means nothing measurable exists yet, so the
                      track renders empty rather than at an invented width. */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
                    {row.percent !== null && (
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${row.percent}%` }}
                      />
                    )}
                  </div>
                  <p className="w-full text-[0.6875rem] text-ink-tertiary">{row.basis}</p>
                </div>
              ))}
            </dl>
          </div>

        </Card>

        {summary.map((item) => (
          <Card
            key={item.id}
            variant="glass"
            className="col-span-12 rounded-2xl p-6 md:col-span-3"
          >
            <div className="mb-4 flex items-center gap-4">
              <span className="grid size-10 place-items-center rounded-full bg-brand/15 text-brand">
                {React.createElement(summaryIcons[item.icon] ?? TrendingUp, {
                  className: "size-5",
                  "aria-hidden": true,
                } as never)}
              </span>
              <h3 className="font-heading text-base font-bold text-ink">{item.title}</h3>
            </div>
            <p data-tabular className="font-heading text-[2rem] leading-none font-bold text-ink">
              {item.value}
            </p>
            {/* Absent rather than padded with a claim when there is nothing
                meaningful to add. */}
            {item.note && (
              <p className="mt-2 text-[0.8125rem] text-ink-tertiary">{item.note}</p>
            )}
          </Card>
        ))}

        <Card variant="glass" className="col-span-12 rounded-2xl p-6">
          <CommandLogs />
        </Card>
      </div>
    </div>
  );
}
