import type { Metadata } from "next";
import { PieChart, TrendingUp, Users } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StatCard } from "@/components/shared/StatCard";
import { createClient } from "@/lib/supabase/server";
import { allocationFrom } from "@/lib/derive";
import { listAssignments, listStaff } from "@/lib/supabase/staff-actions";
import { AllocationGrid } from "./AllocationGrid";

export const metadata: Metadata = { title: "Resource Allocation" };

export default async function AdminAllocationPage() {
  const supabase = await createClient();
  const [staff, assignments, projectsRes] = await Promise.all([
    listStaff(),
    listAssignments(),
    supabase.from("projects").select("id, name").neq("status", "Archived").order("name"),
  ]);

  const summary = allocationFrom(staff);
  // Billable share is the ratio of billable people to the roster. Both numbers
  // exist; the previous 87.5% / 12.5% split did not come from either of them.
  const billable = staff.filter((s) => s.is_billable).length;
  const billablePct = staff.length > 0 ? Math.round((billable / staff.length) * 100) : null;

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Staff", href: "/admin/staff" },
          { label: "Allocation" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Resource Heatmap
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Booked hours against contracted hours, per specialist. Every figure
          here is one recorded number divided by another — where a number is
          missing you see a dash, not a plausible-looking default.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Global utilisation"
          value={summary.globalUtilisation === null ? "—" : `${summary.globalUtilisation}%`}
          caption={
            summary.globalUtilisation === null
              ? "No capacity recorded"
              : `${summary.totalAssigned}h of ${summary.totalCapacity}h`
          }
          icon={PieChart}
        />
        <StatCard label="On the roster" value={String(summary.headcount)} icon={Users} />
        <StatCard
          label="Overbooked"
          value={String(summary.overbooked)}
          caption={summary.unscheduled > 0 ? `${summary.unscheduled} unscheduled` : undefined}
        />
        <StatCard
          label="Billable share"
          value={billablePct === null ? "—" : `${billablePct}%`}
          caption={billablePct === null ? "Nobody on the roster" : `${billable} of ${staff.length}`}
          icon={TrendingUp}
        />
      </div>

      <AllocationGrid
        staff={staff}
        assignments={assignments}
        projects={(projectsRes.data ?? []) as { id: string; name: string }[]}
      />
    </div>
  );
}
