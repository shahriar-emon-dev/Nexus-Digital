import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Projects detail" };

export default function ClientProjectsPage() {
  return <RouteScaffold title="Projects detail" route="/client/projects/[id]" />;
}
