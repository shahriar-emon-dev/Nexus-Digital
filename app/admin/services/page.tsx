import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Services" };

export default function AdminServicesPage() {
  return <RouteScaffold title="Services" route="/admin/services" />;
}
