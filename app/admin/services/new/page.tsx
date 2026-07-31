import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CreateServiceWizard } from "./CreateServiceWizard";

export const metadata: Metadata = { title: "Create service" };

export default function AdminCreateServicePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Services", href: "/admin/services" },
          { label: "New" },
        ]}
      />
      <CreateServiceWizard />
    </div>
  );
}
