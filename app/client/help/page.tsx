import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Help" };

export default function ClientHelpPage() {
  return (
    <RouteScaffold
      title="Help"
      route="/client/help"
      description="Guides and answers for the client portal."
    />
  );
}
