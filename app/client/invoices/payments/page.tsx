import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Payments" };

export default function ClientPaymentsPage() {
  return (
    <RouteScaffold title="Payments" route="/client/invoices/payments" description="Payment methods, receipts and transaction history." />
  );
}
