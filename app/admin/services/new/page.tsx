import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "New Service" };

export default function AdminServicesNewPage() {
  return <RouteScaffold title="New Service" route="/admin/services/new" />;
}
