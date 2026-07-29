import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Projects" };

export default function ClientProjectsPage() {
  return <RouteScaffold title="Projects" route="/client/projects" />;
}
