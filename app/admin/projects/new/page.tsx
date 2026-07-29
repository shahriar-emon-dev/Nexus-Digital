import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "New Project" };

export default function AdminProjectsNewPage() {
  return <RouteScaffold title="New Project" route="/admin/projects/new" />;
}
