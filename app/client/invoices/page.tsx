import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Invoices" };

export default function ClientInvoicesPage() {
  return <RouteScaffold title="Invoices" route="/client/invoices" />;
}
