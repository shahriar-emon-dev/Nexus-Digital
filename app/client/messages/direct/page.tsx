import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Direct Messages" };

export default function ClientDirectMessagesPage() {
  return (
    <RouteScaffold
      title="Direct Messages"
      route="/client/messages/direct"
      description="One-to-one conversations with your delivery team."
    />
  );
}
