import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CreateServiceButton } from "@/app/admin/content/services/CreateServiceButton";
import { listServiceCategories, listServices } from "@/lib/supabase/service-actions";
import { ServicesCatalogue } from "./ServicesCatalogue";

export const metadata: Metadata = { title: "Services Catalog" };

// The catalogue changes as services are created and published; prerendering it
// would freeze whatever existed at build time.
export const dynamic = "force-dynamic";

/**
 * The one service management screen.
 *
 * There used to be two: this route with a hardcoded catalogue and its own
 * editor, and /admin/content/services backed by the page engine. A published
 * service page could have come from either, and nothing said which. Now a
 * service IS a page, this screen owns the catalogue fields a page does not
 * have, and the page builder owns the content.
 */
export default async function AdminServicesPage() {
  const [services, categories] = await Promise.all([listServices(), listServiceCategories()]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Services" }]} />

      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Services Catalog
          </h1>
          <p className="mt-2 max-w-2xl text-ink-tertiary">
            Everything the agency sells. Each service is a page under{" "}
            <code className="text-ink-secondary">/services/</code>, edited in the
            page builder — this screen owns only the catalogue fields the page
            itself does not carry.
          </p>
        </div>

        <CreateServiceButton />
      </header>

      <ServicesCatalogue initial={services} categories={categories} />
    </div>
  );
}
