import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Settings" };

export default function ClientSettingsPage() {
  return <RouteScaffold title="Settings" route="/client/settings" />;
}
