import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Key Management" };

export default function AdminKeyManagementPage() {
  return (
    <RouteScaffold title="Key Management" route="/admin/keys" description="API keys, rotation schedule and scope grants." />
  );
}
