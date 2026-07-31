import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Audit Logs" };

export default function AdminAuditLogsPage() {
  return (
    <RouteScaffold title="Audit Logs" route="/admin/audit-logs" description="Immutable record of every privileged action." />
  );
}
