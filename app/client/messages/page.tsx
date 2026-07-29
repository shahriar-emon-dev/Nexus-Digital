import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Messages" };

export default function ClientMessagesPage() {
  return <RouteScaffold title="Messages" route="/client/messages" />;
}
