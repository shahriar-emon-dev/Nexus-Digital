import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getProjectOptions, listAdminProjects } from "@/lib/supabase/project-actions";
import { ProjectsTable } from "./ProjectsTable";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const [projects, options] = await Promise.all([listAdminProjects(), getProjectOptions()]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Projects" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Projects
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every engagement, with the board and roadmap the client sees. Progress
          is computed from task completion rather than typed in, so it cannot
          disagree with the board.
        </p>
      </header>

      <ProjectsTable initial={projects} options={options} />
    </div>
  );
}
