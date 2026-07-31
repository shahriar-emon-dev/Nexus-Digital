import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Tax Reports" };

export default function ClientTaxReportsPage() {
  return (
    <RouteScaffold title="Tax Reports" route="/client/invoices/tax-reports" description="Downloadable tax summaries for each financial year." />
  );
}
