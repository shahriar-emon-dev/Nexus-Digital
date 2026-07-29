import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Staff detail" };

export default function AdminStaffPage() {
  return <RouteScaffold title="Staff detail" route="/admin/staff/[id]" />;
}
