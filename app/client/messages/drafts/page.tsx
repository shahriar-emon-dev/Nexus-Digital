import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Drafts" };

export default function ClientDraftsPage() {
  return (
    <RouteScaffold
      title="Drafts"
      route="/client/messages/drafts"
      description="Messages you started but have not sent."
    />
  );
}
