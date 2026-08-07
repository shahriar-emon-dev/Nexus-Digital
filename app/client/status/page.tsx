import type { Metadata } from "next";
import { Signal } from "lucide-react";

import { NotInstrumented } from "@/components/admin/NotInstrumented";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Status" };

/**
 * Deliberately not a green "all systems operational" panel.
 *
 * Nothing in this system monitors uptime. The public footer used to carry a
 * pulsing "99.99%" pill for exactly that reason and it was removed; inventing
 * the same claim on a dedicated page would be worse, not better.
 */
export default function ClientStatusPage() {
  return (
    <>
      <DashboardHeader
        title="Status"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Status" }]}
      />

      <div className="mx-auto w-full max-w-2xl px-5 py-10 lg:px-8">
        <NotInstrumented
          icon={Signal}
          title="No uptime monitoring is connected"
          summary="This page would show platform availability and any active incidents. Nothing currently measures either, so there is no reading to show — and a green light nobody is checking is worse than no light at all."
          needs={[
            {
              label: "An uptime monitor",
              detail:
                "A external checker (Better Stack, Pingdom, Checkly) polling the public site and the API, with a status endpoint to read.",
            },
            {
              label: "An incident record",
              detail:
                "Somewhere to publish an incident and its updates, so this page can say what is happening rather than only whether something is up.",
            },
          ]}
          related={[
            {
              label: "Support",
              href: "/client/support",
              detail: "Open a ticket if something is not working for you.",
            },
          ]}
        />
      </div>
    </>
  );
}
