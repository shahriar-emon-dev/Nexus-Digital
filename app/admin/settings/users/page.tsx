import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Users" };

export default function AdminSettingsUsersPage() {
  return <RouteScaffold title="Users" route="/admin/settings/users" />;
}
