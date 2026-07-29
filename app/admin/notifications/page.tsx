import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Notifications" };

export default function AdminNotificationsPage() {
  return <RouteScaffold title="Notifications" route="/admin/notifications" />;
}
