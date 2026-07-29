import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Projects detail" };

export default function AdminProjectsPage() {
  return <RouteScaffold title="Projects detail" route="/admin/projects/[id]" />;
}
