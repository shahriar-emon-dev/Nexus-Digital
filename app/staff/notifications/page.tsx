import type { Metadata } from "next";

import { listNotifications } from "@/lib/supabase/notification-actions";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { NotificationsList } from "./NotificationsList";

export const metadata: Metadata = { title: "Notifications" };

/**
 * Was a placeholder, and there was no notifications table at all — the shell's
 * bell showed three invented entries to everybody, including a "$12,400
 * overdue" line for an invoice that was never issued.
 */
export default async function StaffNotificationsPage() {
  const items = await listNotifications();

  return (
    <>
      <DashboardHeader
        title="Notifications"
        description="Raised by the system when something needs you. Only you can see these."
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Notifications" }]}
      />

      <div className="mx-auto w-full max-w-4xl px-5 py-6 lg:px-8">
        <NotificationsList items={items} />
      </div>
    </>
  );
}
