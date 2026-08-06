import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getPageDraft } from "@/lib/supabase/page-actions";
import { getServiceConfig } from "@/lib/supabase/service-config";
import { PageEditor } from "./PageEditor";

export const metadata: Metadata = { title: "Edit page" };

export default async function AdminPageEditorRoute({ params }: { params: { id: string } }) {
  const draft = await getPageDraft(params.id);
  if (!draft) notFound();

  // Only a service page has catalogue fields; everything else gets the same
  // editor without that pane rather than a second editor.
  const serviceConfig =
    draft.page.page_type === "service" ? await getServiceConfig(params.id) : null;

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Pages", href: "/admin/content/pages" },
          { label: draft.page.title },
        ]}
      />
      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          {draft.page.title}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Edits save automatically to the draft. The public page does not change
          until you publish.
        </p>
      </header>

      <PageEditor draft={draft} serviceConfig={serviceConfig} />
    </div>
  );
}
