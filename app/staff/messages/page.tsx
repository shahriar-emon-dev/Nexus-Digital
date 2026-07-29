import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Messages" };

export default function StaffMessagesPage() {
  return <RouteScaffold title="Messages" route="/staff/messages" />;
}
