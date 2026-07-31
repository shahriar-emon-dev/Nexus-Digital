import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Support" };

export default function StaffSupportPage() {
  return (
    <RouteScaffold title="Support" route="/staff/support" description="Raise an internal ticket or reach the platform team." />
  );
}
