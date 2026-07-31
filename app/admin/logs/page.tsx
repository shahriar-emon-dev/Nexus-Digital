import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Logs" };

export default function AdminLogsPage() {
  return (
    <RouteScaffold
      title="Logs"
      route="/admin/logs"
      description="Raw application and infrastructure log stream."
    />
  );
}
