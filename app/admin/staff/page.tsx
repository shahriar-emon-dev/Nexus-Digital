import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listStaff, listUnrosteredProfiles } from "@/lib/supabase/staff-actions";
import { StaffRoster } from "./StaffRoster";

export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const [staff, unrostered] = await Promise.all([listStaff(), listUnrosteredProfiles()]);

  // Offered departments come from the roster itself plus the enum, so the
  // filter never lists a department nobody is in.
  const departments = [...new Set(staff.map((s) => s.department).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[{ label: "Command Center", href: "/admin" }, { label: "Staff" }]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Staff Directory
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          The roster behind the public About page and the allocation view.
          Utilisation is assigned hours over contracted hours — so somebody
          part-time is not read as underutilised, and an empty figure means
          nothing is scheduled rather than nobody is working.
        </p>
      </header>

      <StaffRoster initial={staff} unrostered={unrostered} departments={departments} />
    </div>
  );
}
