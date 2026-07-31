import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CreatePageWizard } from "./CreatePageWizard";

export const metadata: Metadata = { title: "Create page" };

export default function AdminCreatePagePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "CMS", href: "/admin/content/blog" },
          { label: "Landing Pages", href: "/admin/content/pages" },
          { label: "New" },
        ]}
      />

      <CreatePageWizard />
    </div>
  );
}
