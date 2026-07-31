import type { Metadata } from "next";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata: Metadata = { title: "Files" };

export default function ClientFilesPage() {
  return (
    <RouteScaffold
      title="Files"
      route="/client/messages/files"
      description="Every attachment shared across your channels."
    />
  );
}
