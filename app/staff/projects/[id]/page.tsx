import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Projects detail" };

export default function StaffProjectsPage() {
  return <RouteScaffold title="Projects detail" route="/staff/projects/[id]" />;
}
