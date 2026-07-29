import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Meetings" };

export default function StaffMeetingsPage() {
  return <RouteScaffold title="Meetings" route="/staff/meetings" />;
}
