import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Traffic Control" };

export default function AdminTrafficControlPage() {
  return (
    <RouteScaffold title="Traffic Control" route="/admin/traffic" description="Rate limits, WAF rules and edge routing." />
  );
}
