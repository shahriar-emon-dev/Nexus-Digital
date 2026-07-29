import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Clients detail" };

export default function AdminClientsPage() {
  return <RouteScaffold title="Clients detail" route="/admin/clients/[id]" />;
}
