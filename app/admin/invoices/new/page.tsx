import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "New Invoice" };

export default function AdminInvoicesNewPage() {
  return <RouteScaffold title="New Invoice" route="/admin/invoices/new" />;
}
