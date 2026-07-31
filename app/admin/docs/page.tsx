import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Docs" };

export default function AdminDocsPage() {
  return (
    <RouteScaffold title="Docs" route="/admin/docs" description="Runbooks and internal platform documentation." />
  );
}
