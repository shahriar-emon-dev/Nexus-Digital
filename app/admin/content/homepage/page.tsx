import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Homepage" };

export default function AdminContentHomepagePage() {
  return <RouteScaffold title="Homepage" route="/admin/content/homepage" />;
}
