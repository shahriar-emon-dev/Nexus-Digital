import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, LifeBuoy, ScrollText, ShieldAlert, Wrench } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Support" };

/**
 * Where to go when something is wrong, by symptom.
 *
 * Every route listed here exists and answers the question next to it. The
 * previous version was a placeholder, which is the worst thing for a support
 * screen to be — it is reached precisely when something has already failed.
 */

const routes = [
  {
    icon: ShieldAlert,
    title: "A screen refused me",
    body: "Access is decided by your role's grants, not by the menu. The Security screen shows which grants exist and which accounts hold them; a Global Admin can change them under Access Control.",
    href: "/admin/settings/security",
    label: "Check your access",
  },
  {
    icon: ScrollText,
    title: "Something changed and nobody knows who did it",
    body: "Role changes, portal reassignments, deactivations and credential changes are recorded by database triggers with the actor's name and email, and cannot be edited or deleted by anyone.",
    href: "/admin/audit-logs",
    label: "Open the audit log",
  },
  {
    icon: Wrench,
    title: "The application feels slow",
    body: "Query Intelligence reports live connection-pool pressure, buffer cache hit rate and the slowest statements measured by pg_stat_statements — the actual figures, not a status light.",
    href: "/admin/database",
    label: "Open Query Intelligence",
  },
  {
    icon: LifeBuoy,
    title: "Something needs doing and it has been lost track of",
    body: "Overdue invoices, reviews awaiting moderation, keys past rotation and admin accounts with no role are all computed from live data and listed in one place.",
    href: "/admin/notifications",
    label: "See what needs attention",
  },
];

export default function AdminSupportPage() {
  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Support" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Support
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">Where to look first, by symptom.</p>
      </header>

      <Alert tone="info">
        <AlertTitle>There is no ticket queue in this application</AlertTitle>
        <AlertDescription>
          Rather than a contact form that posts nowhere, this page routes you to
          the screen that answers each question — and every one of them reads
          live data.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {routes.map((r) => (
          <Card key={r.href}>
            <CardHeader className="flex-row items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-subtle-fg">
                <r.icon className="size-4" aria-hidden />
              </span>
              <CardTitle className="mt-1">{r.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-ink-secondary">{r.body}</p>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                render={<Link href={r.href} />}
              >
                {r.label}
                <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
