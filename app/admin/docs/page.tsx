import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookText, Database, KeyRound, Layers, ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Docs" };

/**
 * Operator documentation for this platform.
 *
 * Deliberately about *this* system and how it behaves, rather than a link farm
 * to an external wiki that may not exist. Everything stated here is a property
 * the schema or the code actually enforces, so it cannot quietly become false.
 */

const sections = [
  {
    icon: Layers,
    title: "Everything publishable is a page",
    body: "Services, case studies, blog posts, landing pages and the homepage are all rows in `pages` with a page_type marker and a template. They share one editor, one draft and publish flow, one version history and one media library. There is no second CMS.",
    links: [
      { label: "Page list", href: "/admin/content/pages" },
      { label: "Services catalogue", href: "/admin/services" },
    ],
  },
  {
    icon: Database,
    title: "Money is never stored, only derived",
    body: "An invoice has line items, a discount percentage and a tax percentage. Subtotal, tax, total, paid and outstanding all come from the invoice_totals view, and tax is charged on the discounted subtotal. Nothing writes a total, so no total can disagree with what it is made of. The same principle covers project progress, client revenue and staff utilisation.",
    links: [
      { label: "Invoices", href: "/admin/invoices" },
      { label: "Clients", href: "/admin/clients" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Access is decided by the database",
    body: "Every table has row level security. A role's grants live in role_grants, and the middleware hides navigation a role cannot open — but the gate itself is the policy, not the menu. A request that bypasses the interface entirely gets the same answer.",
    links: [
      { label: "Access Control", href: "/admin/access-control" },
      { label: "Security posture", href: "/admin/settings/security" },
    ],
  },
  {
    icon: KeyRound,
    title: "Secrets are not in this database",
    body: "api_credentials stores a provider prefix and the last four characters of a key. There is no column a secret could be written to, no reveal button, and no endpoint that returns one. Rotating a key means replacing it at the provider and recording that here — this application cannot rotate a third-party key on your behalf, and a button implying otherwise would be a lie.",
    links: [{ label: "Key Management", href: "/admin/keys" }],
  },
  {
    icon: BookText,
    title: "Privileged actions record themselves",
    body: "Role changes, portal reassignments, deactivations and credential changes are written to audit_log by database triggers, not by the application. A change made in the SQL editor is logged identically to one made in this console. The table refuses UPDATE, DELETE and TRUNCATE for every role, including the service role.",
    links: [{ label: "Audit log", href: "/admin/audit-logs" }],
  },
];

export default function AdminDocsPage() {
  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Docs" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Platform notes
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          How this system behaves, and why. Each note describes a property the
          schema enforces rather than a convention someone has to remember.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex-row items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-subtle-fg">
                <s.icon className="size-4" aria-hidden />
              </span>
              <CardTitle className="mt-1">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-ink-secondary">{s.body}</p>
              <div className="flex flex-wrap gap-2">
                {s.links.map((l) => (
                  <Button key={l.href} variant="outline" size="sm" render={<Link href={l.href} />}>
                    {l.label}
                    <ArrowRight />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
