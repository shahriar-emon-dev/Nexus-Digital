import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Invoices detail" };

export default function ClientInvoicesPage() {
  return <RouteScaffold title="Invoices detail" route="/client/invoices/[id]" />;
}
