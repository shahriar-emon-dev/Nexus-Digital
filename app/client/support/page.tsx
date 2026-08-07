import type { Metadata } from "next";

import { listReplies, listTickets } from "@/lib/supabase/support-actions";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TicketWorkspace } from "@/components/support/TicketWorkspace";

export const metadata: Metadata = { title: "Support" };

/**
 * The client side of support. Was a placeholder.
 *
 * `canManage` is false: a client opens and replies, but does not set status or
 * leave internal notes. RLS refuses those regardless — this only decides
 * whether to offer controls that would be rejected.
 */
export default async function ClientSupportPage({
  searchParams,
}: {
  searchParams: { ticket?: string };
}) {
  const tickets = await listTickets();

  const requested = searchParams.ticket;
  const active =
    (requested && tickets.some((t) => t.id === requested) ? requested : null) ??
    tickets[0]?.id ??
    null;
  const replies = active ? await listReplies(active) : [];

  return (
    <>
      <DashboardHeader
        title="Support"
        description="Ask us anything. Every request gets a reference you can quote."
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Support" }]}
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8">
        <TicketWorkspace
          tickets={tickets}
          activeTicketId={active}
          replies={replies}
          canManage={false}
        />
      </div>
    </>
  );
}
