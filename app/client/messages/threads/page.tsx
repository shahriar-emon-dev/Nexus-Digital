import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Threads" };

export default function ClientThreadsPage() {
  return (
    <RouteScaffold
      title="Threads"
      route="/client/messages/threads"
      description="Replies branched off a channel message."
    />
  );
}
