import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Projects" };

export default function AdminProjectsPage() {
  return <RouteScaffold title="Projects" route="/admin/projects" />;
}
