import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { getLeadPipeline, listLeads } from "@/lib/supabase/lead-actions";
import { LeadsTable } from "./LeadsTable";

export const metadata: Metadata = { title: "Lead Intelligence" };

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const [leads, pipeline, staff] = await Promise.all([
    listLeads(),
    getLeadPipeline(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("portal", ["STAFF", "ADMIN"])
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Leads" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Lead Intelligence
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every enquiry submitted from the public site, with the reference the
          visitor was shown. Conversion counts won against decided leads, so an
          open enquiry is not silently treated as a failure.
        </p>
      </header>

      <LeadsTable
        initial={leads}
        pipeline={pipeline}
        assignees={(staff.data ?? []) as { id: string; full_name: string; email: string }[]}
      />
    </div>
  );
}
