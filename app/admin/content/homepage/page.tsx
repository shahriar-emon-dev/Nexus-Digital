import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Home, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { getSiteSettings } from "@/lib/supabase/nav-actions";
import { listPages } from "@/lib/supabase/page-actions";
import { CreateHomepageButton } from "./CreateHomepageButton";

export const metadata: Metadata = { title: "Homepage" };

// This screen decides whether to redirect based on a setting that changes at
// runtime. Prerendering it captured the state at build time, so the redirect
// never fired after an admin assigned a homepage.
export const dynamic = "force-dynamic";

/**
 * The homepage is not a special kind of page — it is whichever published page
 * `site_settings.homepage_page_id` points at, edited in the same builder as
 * every other page. This screen is a shortcut to it, not a second editor.
 */
export default async function AdminHomepagePage() {
  const [settings, pages] = await Promise.all([getSiteSettings(), listPages()]);

  // Redirect on the setting alone. Looking the page up in listPages() made the
  // jump depend on that list being fresh, which it was not.
  if (settings.homepage_page_id) {
    redirect(`/admin/content/pages/${settings.homepage_page_id}`);
  }

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "CMS", href: "/admin/content/pages" },
          { label: "Homepage" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Homepage
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          The site currently serves the built-in marketing homepage. Build a CMS
          homepage to take control of it, or assign an existing page from
          Navigation &amp; Menus.
        </p>
      </header>

      <div className="max-w-2xl">
        <EmptyState
          icon={Home}
          title="No CMS homepage yet"
          description="Creating one makes a draft you can edit with the page builder. Nothing changes on the public site until you publish it and assign it."
          action={<CreateHomepageButton />}
          secondaryAction={
            <Button variant="outline" size="sm" render={<Link href="/admin/content/navigation" />}>
              <ExternalLink />
              Assign an existing page
            </Button>
          }
        />

        {pages.filter((p) => p.status === "published").length > 0 && (
          <Card className="mt-6">
            <CardContent className="py-5">
              <p className="mb-3 text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
                Published pages you could use
              </p>
              <ul className="flex flex-col gap-2">
                {pages
                  .filter((p) => p.status === "published")
                  .slice(0, 5)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{p.title}</span>
                        <code className="block truncate font-mono text-xs text-ink-tertiary">
                          /{p.slug}
                        </code>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge variant="success">{p.status}</Badge>
                        <Button
                          variant="ghost"
                          size="xs"
                          render={<Link href={`/admin/content/pages/${p.id}`} />}
                        >
                          <Pencil />
                          Edit
                        </Button>
                      </span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
