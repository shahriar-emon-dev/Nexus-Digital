import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotInstrumented } from "@/components/admin/NotInstrumented";

export const metadata: Metadata = { title: "Traffic Control" };

export default function AdminTrafficPage() {
  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[{ label: "Command Center", href: "/admin" }, { label: "Traffic Control" }]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Traffic Control
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Rate limits, WAF rules and edge routing.
        </p>
      </header>

      <NotInstrumented
        icon={SlidersHorizontal}
        title="Rate limits, WAF rules and edge routing"
        summary="request volume, blocked requests or edge routing decisions."
        needs={[
          {
            label: "An edge or CDN provider",
            detail:
              "Cloudflare, Vercel Edge or an ALB in front of the app. Rate limiting and WAF rules are configured and enforced there; this screen would read and write them through that provider's API.",
          },
          {
            label: "A request log sink",
            detail:
              "Request-level telemetry is not something the application database holds. Volume, status-code mix and blocked-request counts come from the edge provider's analytics or a log drain.",
          },
        ]}
        related={[
          {
            label: "Database load",
            href: "/admin/database",
            detail: "Connection pressure and slow statements are measured and shown.",
          },
          {
            label: "Privileged actions",
            href: "/admin/audit-logs",
            detail: "Every role and credential change, written by database triggers.",
          },
        ]}
      />
    </div>
  );
}
