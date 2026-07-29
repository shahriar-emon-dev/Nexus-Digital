import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return <RouteScaffold title="Settings" route="/admin/settings" />;
}
