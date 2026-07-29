import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Security" };

export default function AdminSettingsSecurityPage() {
  return <RouteScaffold title="Security" route="/admin/settings/security" />;
}
