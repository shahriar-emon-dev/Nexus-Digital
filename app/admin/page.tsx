import { CircleDollarSign, FolderKanban, Plus, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { StatCard } from "@/components/shared/StatCard";
import { ClientsTable, type ClientRow } from "./ClientsTable";

const clients: ClientRow[] = [
  { id: "c1", name: "Northwind Retail", owner: "Dez Okafor", status: "healthy", mrr: 42000, projects: 3, renews: "12 Nov 2026" },
  { id: "c2", name: "Halcyon Health", owner: "Mira Kaur", status: "at-risk", mrr: 31500, projects: 2, renews: "03 Sep 2026" },
  { id: "c3", name: "Lumen Studio", owner: "Dez Okafor", status: "healthy", mrr: 18750, projects: 1, renews: "28 Jan 2027" },
  { id: "c4", name: "Ardent Logistics", owner: "Sam Ellery", status: "onboarding", mrr: 26000, projects: 2, renews: "15 Mar 2027" },
  { id: "c5", name: "Verity Financial", owner: "Mira Kaur", status: "healthy", mrr: 38400, projects: 4, renews: "07 Dec 2026" },
  { id: "c6", name: "Orient Foods", owner: "Sam Ellery", status: "at-risk", mrr: 12800, projects: 1, renews: "22 Aug 2026" },
  { id: "c7", name: "Kestrel Energy", owner: "Dez Okafor", status: "healthy", mrr: 14750, projects: 2, renews: "09 Feb 2027" },
];

export default function AdminOverviewPage() {
  return (
    <>
      <DashboardHeader
        title="Executive overview"
        description="Where the agency stands this month, and what needs a decision from you."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Overview" }]}
        actions={
          <Button size="sm">
            <Plus />
            New client
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-5 py-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Monthly recurring revenue"
            value="$184.2k"
            delta="+12.4%"
            direction="up"
            caption="vs. $163.9k last month"
            icon={CircleDollarSign}
            series={[118, 132, 127, 149, 161, 158, 184]}
          />
          <StatCard
            label="Active projects"
            value="18"
            delta="+3"
            direction="up"
            caption="4 entering review this week"
            icon={FolderKanban}
            series={[12, 13, 13, 15, 16, 15, 18]}
          />
          <StatCard
            label="Staff utilisation"
            value="87%"
            delta="2.1%"
            direction="down"
            positiveIsGood
            caption="Target band is 78–85%"
            icon={Users}
            series={[81, 83, 84, 86, 88, 89, 87]}
          />
          <StatCard
            label="Pipeline value"
            value="$612k"
            delta="+8.9%"
            direction="up"
            caption="9 opportunities in late stage"
            icon={TrendingUp}
            series={[430, 452, 488, 501, 540, 562, 612]}
          />
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold text-ink">Client accounts</h2>
              <p className="mt-0.5 text-sm text-ink-tertiary">
                Sorted by revenue. Two accounts are flagged at risk.
              </p>
            </div>
            <Badge variant="warning">2 need attention</Badge>
          </div>

          <ClientsTable clients={clients} />
        </section>
      </div>
    </>
  );
}
