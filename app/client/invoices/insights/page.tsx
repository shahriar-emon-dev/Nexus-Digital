import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Insights" };

export default function ClientInsightsPage() {
  return (
    <RouteScaffold title="Insights" route="/client/invoices/insights" description="Spend trends and burn rate across your engagements." />
  );
}
