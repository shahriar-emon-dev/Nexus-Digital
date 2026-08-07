import type { Metadata } from "next";

import { listReplies, listTickets, ticketStats } from "@/lib/supabase/support-actions";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TicketWorkspace } from "@/components/support/TicketWorkspace";

export const metadata: Metadata = { title: "Support" };

/**
 * The staff side of support. Was a placeholder with no table behind it.
 *
 * `canManage` is true here because a staff account may change status and leave
 * internal notes — but the policies enforce that independently, so rendering
 * the controls is not what grants the permission.
 */
export default async function StaffSupportPage({
  searchParams,
}: {
  searchParams: { ticket?: string };
}) {
  const [tickets, stats] = await Promise.all([listTickets(), ticketStats()]);

  const requested = searchParams.ticket;
  const active =
    (requested && tickets.some((t) => t.id === requested) ? requested : null) ??
    tickets[0]?.id ??
    null;
  const replies = active ? await listReplies(active) : [];

  const cards = [
    { label: "Open", value: stats.open },
    { label: "Pending", value: stats.pending },
    { label: "Resolved", value: stats.resolved },
  ];

  return (
    <>
      <DashboardHeader
        title="Support"
        description="Requests from clients and colleagues."
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Support" }]}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
        <dl className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.label} variant="glass" className="rounded-2xl p-5">
              <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                {card.label}
              </dt>
              <dd
                data-tabular
                className="mt-1 font-heading text-[1.75rem] leading-none font-bold text-ink"
              >
                {card.value}
              </dd>
            </Card>
          ))}
        </dl>

        <TicketWorkspace
          tickets={tickets}
          activeTicketId={active}
          replies={replies}
          canManage
        />
      </div>
    </>
  );
}
