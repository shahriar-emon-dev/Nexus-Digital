import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Clients" };

export default function ClientClientsPage() {
  return (
    <RouteScaffold title="Clients" route="/client/entities" description="Billing entities and subsidiaries linked to your account." />
  );
}
