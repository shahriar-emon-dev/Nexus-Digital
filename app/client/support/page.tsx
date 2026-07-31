import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Support" };

export default function ClientSupportPage() {
  return (
    <RouteScaffold title="Support" route="/client/support" description="Raise a ticket with your delivery or billing team." />
  );
}
