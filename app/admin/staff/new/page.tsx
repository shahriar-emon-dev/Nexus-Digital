import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "New Staff" };

export default function AdminStaffNewPage() {
  return <RouteScaffold title="New Staff" route="/admin/staff/new" />;
}
