import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Meetings" };

export default function ClientMeetingsPage() {
  return <RouteScaffold title="Meetings" route="/client/meetings" />;
}
