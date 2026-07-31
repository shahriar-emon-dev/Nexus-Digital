import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Nodes" };

export default function AdminNodesPage() {
  return (
    <RouteScaffold title="Nodes" route="/admin/nodes" description="Health and capacity of every compute node." />
  );
}
