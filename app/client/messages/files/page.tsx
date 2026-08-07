import type { Metadata } from "next";

import { listProjectFiles } from "@/lib/supabase/file-actions";
import { listProjectOptions } from "@/lib/supabase/project-queries";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { FileLibrary } from "@/components/shared/FileLibrary";

export const metadata: Metadata = { title: "Files" };

/** Was a placeholder. Clients may upload to their own projects. */
export default async function ClientFilesPage() {
  const [files, projects] = await Promise.all([listProjectFiles(), listProjectOptions()]);

  return (
    <>
      <DashboardHeader
        title="Files"
        description="Documents and assets shared on your projects."
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Messages", href: "/client/messages" },
          { label: "Files" },
        ]}
      />

      <div className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-8">
        <FileLibrary files={files} projects={projects} canUpload />
      </div>
    </>
  );
}
