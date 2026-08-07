import type { Metadata } from "next";

import { listProjectFiles } from "@/lib/supabase/file-actions";
import { listProjectOptions } from "@/lib/supabase/project-queries";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { FileLibrary } from "@/components/shared/FileLibrary";

export const metadata: Metadata = { title: "Files" };

/** Was a placeholder with no table behind it. */
export default async function StaffFilesPage() {
  const [files, projects] = await Promise.all([listProjectFiles(), listProjectOptions()]);

  return (
    <>
      <DashboardHeader
        title="Files"
        description="Everything shared on projects you can see."
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Files" }]}
      />

      <div className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-8">
        <FileLibrary files={files} projects={projects} canUpload />
      </div>
    </>
  );
}
