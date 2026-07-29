import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Invoices detail" };

export default function AdminInvoicesPage() {
  return <RouteScaffold title="Invoices detail" route="/admin/invoices/[id]" />;
}
