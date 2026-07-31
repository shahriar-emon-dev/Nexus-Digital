import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Status" };

export default function ClientStatusPage() {
  return (
    <RouteScaffold
      title="Status"
      route="/client/status"
      description="Live availability of the services behind your projects."
    />
  );
}
