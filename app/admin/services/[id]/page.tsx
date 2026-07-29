import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Services detail" };

export default function AdminServicesPage() {
  return <RouteScaffold title="Services detail" route="/admin/services/[id]" />;
}
