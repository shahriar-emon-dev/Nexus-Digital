import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Integrations" };

export default function AdminSettingsIntegrationsPage() {
  return <RouteScaffold title="Integrations" route="/admin/settings/integrations" />;
}
