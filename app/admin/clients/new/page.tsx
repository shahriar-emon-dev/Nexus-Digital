import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "New Client" };

export default function AdminClientsNewPage() {
  return <RouteScaffold title="New Client" route="/admin/clients/new" />;
}
