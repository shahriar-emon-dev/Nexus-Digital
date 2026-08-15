import type { Metadata } from "next";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { NotificationsList } from "@/app/staff/notifications/NotificationsList";
import { listNotifications } from "@/lib/supabase/notification-actions";

export const metadata: Metadata = { title: "Notifications" };

/**
 * The client notification feed.
 *
 * Staff had a notifications screen and clients did not, despite database
 * triggers writing to their inbox for milestone completion, deliverables ready
 * for review, new messages and invoice status changes. The bell in the header
 * showed the same rows, but there was nowhere to see the full history or work
 * through a backlog.
 *
 * Deliberately the same component the staff portal uses rather than a second
 * implementation: both sides read `public.notifications` through the same
 * policy, which restricts every caller to their own inbox, so there is nothing
 * portal-specific for a fork to encode.
 */
export default async function ClientNotificationsPage() {
  const notifications = await listNotifications(50);

  return (
    <>
      <DashboardHeader
        title="Notifications"
        titleAs="p"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Notifications" }]}
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-8 lg:px-8">
        <h1 className="mb-6 font-heading text-[2rem] leading-tight font-bold tracking-tight text-ink">
          Notifications
        </h1>
        <NotificationsList items={notifications} />
      </div>
    </>
  );
}
