import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Clients" };

export default function AdminClientsPage() {
  return <RouteScaffold title="Clients" route="/admin/clients" />;
}
