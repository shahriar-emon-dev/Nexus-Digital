import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Meetings" };

export default function AdminMeetingsPage() {
  return <RouteScaffold title="Meetings" route="/admin/meetings" />;
}
