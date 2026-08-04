import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listPages } from "@/lib/supabase/page-actions";
import { getSiteSettings, listMenuItems, listMenus } from "@/lib/supabase/nav-actions";
import { CreateMenuButton } from "./CreateMenuButton";
import { NavigationManager } from "./NavigationManager";

export const metadata: Metadata = {
  title: "Navigation & Menus",
  description: "Site menus, their locations, and which page answers the root URL.",
};

export default async function AdminNavigationPage() {
  const [menus, pages, settings] = await Promise.all([
    listMenus(),
    listPages(),
    getSiteSettings(),
  ]);

  // One query per menu is fine at this cardinality — a site has a handful of
  // menus, and the alternative is a client-side group-by over every item.
  const entries = await Promise.all(
    menus.map(async (m) => [m.id, await listMenuItems(m.id)] as const)
  );
  const items = Object.fromEntries(entries);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "CMS", href: "/admin/content/pages" },
          { label: "Navigation" },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Navigation &amp; Menus
          </h1>
          <p className="mt-2 max-w-2xl text-ink-tertiary">
            Menu items reference a page rather than a URL, so renaming a page
            keeps the link working. An item pointing at an unpublished page is
            hidden from the public site automatically.
          </p>
        </div>
        <CreateMenuButton />
      </header>

      <NavigationManager
        menus={menus}
        items={items}
        pages={pages}
        homepageId={settings.homepage_page_id}
      />
    </div>
  );
}
