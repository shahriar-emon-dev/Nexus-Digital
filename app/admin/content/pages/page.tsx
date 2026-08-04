import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listPages } from "@/lib/supabase/page-actions";
import { PagesTable } from "./PagesTable";

export const metadata: Metadata = { title: "Landing Pages" };

export default async function AdminPagesPage() {
  const pages = await listPages();

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "CMS", href: "/admin/content/blog" },
          { label: "Landing Pages" },
        ]}
      />
      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Landing Page Engine
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Pages are stored in the database and published to their own URL. A draft
          is never visible to the public.
        </p>
      </header>

      <PagesTable initialPages={pages} />
    </div>
  );
}
