import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Services detail" };

export default function ServicesPage() {
  return <RouteScaffold title="Services detail" route="/services/[slug]" />;
}
