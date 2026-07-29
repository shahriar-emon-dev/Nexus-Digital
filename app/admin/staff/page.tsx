import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Staff" };

export default function AdminStaffPage() {
  return <RouteScaffold title="Staff" route="/admin/staff" />;
}
