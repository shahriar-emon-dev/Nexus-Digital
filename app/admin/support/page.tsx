import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Support" };

export default function AdminSupportPage() {
  return (
    <RouteScaffold title="Support" route="/admin/support" description="Escalation paths and on-call rota." />
  );
}
