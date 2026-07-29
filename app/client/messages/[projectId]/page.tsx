import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Messages detail" };

export default function ClientMessagesPage() {
  return <RouteScaffold title="Messages detail" route="/client/messages/[projectId]" />;
}
