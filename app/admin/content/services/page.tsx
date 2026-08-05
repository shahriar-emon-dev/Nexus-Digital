import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Layers, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { listPages } from "@/lib/supabase/page-actions";
import { CreateServiceButton } from "./CreateServiceButton";

export const metadata: Metadata = {
  title: "Services",
  description: "Service pages, built with the page builder.",
};

// The list changes as services are created and published; prerendering it
// would freeze whatever existed at build time.
export const dynamic = "force-dynamic";

/**
 * Services are pages.
 *
 * A service needs a slug under `services/`, a marker so it can be listed apart
 * from landing pages, and the block structure a service page always has.
 * Everything else — draft and publish, versions, media, navigation — the page
 * engine already solves. Giving services their own tables would have
 * duplicated all of that for no gain.
 */
export default async function AdminServicesPage() {
  const pages = await listPages();
  const services = pages.filter((p) => p.page_type === "service");

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "CMS", href: "/admin/content/pages" },
          { label: "Services" },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Services
          </h1>
          <p className="mt-2 max-w-2xl text-ink-tertiary">
            Each service is a page under <code className="font-mono">/services/</code>,
            edited in the page builder. Publishing one makes its URL live without
            a developer adding a route.
          </p>
        </div>
        <CreateServiceButton />
      </header>

      {services.length === 0 ? (
        <div className="max-w-2xl">
          <EmptyState
            icon={Layers}
            title="No CMS services yet"
            description="Create one to get a hero, what-we-offer, benefits, packages, testimonials, FAQ and a closing call to action — all editable."
            action={<CreateServiceButton />}
          />
          <p className="mt-4 text-xs text-ink-tertiary">
            The hand-built service pages in the mega-menu keep working. A CMS
            service published at the same slug takes over that URL.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <li key={s.id}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-3 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-heading text-base font-semibold text-ink">{s.title}</h2>
                    <Badge variant={s.status === "published" ? "success" : "warning"}>
                      {s.status}
                    </Badge>
                  </div>
                  <code className="block truncate font-mono text-xs text-ink-tertiary">
                    /{s.slug}
                  </code>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="xs"
                      render={<Link href={`/admin/content/pages/${s.id}`} />}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    {s.status === "published" && (
                      <Button
                        variant="ghost"
                        size="xs"
                        render={<Link href={`/${s.slug}`} target="_blank" />}
                      >
                        <ExternalLink />
                        View
                        <span className="sr-only"> (opens in a new tab)</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
