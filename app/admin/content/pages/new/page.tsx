import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listTemplates } from "@/lib/supabase/page-actions";
import { CreatePageWizard } from "./CreatePageWizard";

export const metadata: Metadata = { title: "Create page" };

export default async function AdminCreatePagePage() {
  const templates = await listTemplates();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Landing Pages", href: "/admin/content/pages" },
          { label: "Create" },
        ]}
      />
      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Create a page
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          The page and its draft are created immediately. Nothing is public until
          you publish.
        </p>
      </header>

      <CreatePageWizard templates={templates} />
    </div>
  );
}
