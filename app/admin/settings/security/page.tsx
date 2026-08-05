import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  KeyRound,
  Minus,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { getSecurityPosture } from "@/lib/supabase/security-queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Security" };

/**
 * Security posture — a read-only overview, deliberately not a second
 * permission matrix. Access Control owns editing; this screen answers "is
 * anything wrong right now", and every figure on it is counted rather than
 * asserted.
 */

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminSettingsSecurityPage() {
  const posture = await getSecurityPosture();

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Security" },
        ]}
      />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Security &amp; Audit
          </h1>
          <p className="mt-2 max-w-2xl text-ink-tertiary">
            What the database can actually attest to. Nothing here is a stated
            posture — every number is counted from live rows, so an empty
            figure means nothing is being measured rather than nothing is
            happening.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/access-control" />}>
            Access Control
            <ArrowRight />
          </Button>
          <Button variant="outline" render={<Link href="/admin/audit-logs" />}>
            Full audit trail
            <ArrowRight />
          </Button>
        </div>
      </header>

      {/* An admin account with no role reaches the shell and every screen
          refuses it — a confusing failure that looks like a bug to the user. */}
      {posture.danglingAdmins.length > 0 && (
        <Alert tone="warning">
          <AlertTitle>
            {posture.danglingAdmins.length} admin{" "}
            {posture.danglingAdmins.length === 1 ? "account has" : "accounts have"} no role assigned
          </AlertTitle>
          <AlertDescription>
            {posture.danglingAdmins.map((a) => a.email).join(", ")} can reach the
            admin shell but every screen inside it will refuse them. Assign a
            role, or move them off the admin portal.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Accounts" value={String(posture.accounts.total)} icon={Users} />
        <StatCard
          label="Active"
          value={String(posture.accounts.active)}
          caption={
            posture.accounts.inactive > 0 ? `${posture.accounts.inactive} deactivated` : undefined
          }
        />
        <StatCard label="Admin portal" value={String(posture.accounts.admins)} icon={ShieldCheck} />
        <StatCard
          label="Session timeout"
          value={`${posture.session.timeoutMinutes}m`}
          caption="Set in Access Control"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ------------------------------------------------ password rules -- */}
        <Card>
          <CardHeader>
            <CardTitle>Password policy</CardTitle>
          </CardHeader>
          <CardContent>
            {posture.password.rules.length === 0 ? (
              <p className="text-sm text-ink-tertiary">
                No policy recorded. Set one in Access Control.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {posture.password.rules.map((r) => (
                  <li key={r.label} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full",
                        r.enabled
                          ? "bg-success-subtle text-success"
                          : "bg-surface-sunken text-ink-tertiary"
                      )}
                    >
                      {r.enabled ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        <Minus className="size-3" aria-hidden />
                      )}
                    </span>
                    <span className={cn("flex-1 text-sm", r.enabled ? "text-ink" : "text-ink-tertiary")}>
                      {r.label}
                    </span>
                    {r.required && (
                      <Badge variant="outline" size="sm">
                        Required
                      </Badge>
                    )}
                    <span className="sr-only">{r.enabled ? "enforced" : "not enforced"}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 border-t border-line-subtle pt-3 text-xs text-ink-tertiary">
              Two-factor enforcement is set to{" "}
              <strong className="text-ink-secondary">
                {posture.session.totpEnforcement ?? "not configured"}
              </strong>
              . This records the policy; enrolment itself is handled by the
              identity provider, so no completion percentage is claimed here.
            </p>
          </CardContent>
        </Card>

        {/* --------------------------------------------- isolation policies -- */}
        <Card>
          <CardHeader>
            <CardTitle>Data isolation</CardTitle>
          </CardHeader>
          <CardContent>
            {posture.policies.length === 0 ? (
              <p className="text-sm text-ink-tertiary">No isolation policies defined.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {posture.policies.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <Badge variant={p.enabled ? "success" : "outline"} size="sm" className="mt-0.5">
                      {p.enabled ? "On" : "Off"}
                    </Badge>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{p.label}</span>
                      <span className="block text-xs text-ink-tertiary">{p.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* -------------------------------------------------- recent events -- */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Recent security events</CardTitle>
          <Button variant="link" size="sm" render={<Link href="/admin/audit-logs?severity=critical" />}>
            Critical only
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {posture.events.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ScrollText}
                title="Nothing flagged"
                description="Role changes, portal reassignments, deactivations and credential rotations appear here as they happen. An empty list means none have occurred, not that none were recorded."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line-subtle">
              {posture.events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      e.severity === "critical"
                        ? "bg-danger-subtle text-danger"
                        : "bg-warning-subtle text-warning"
                    )}
                  >
                    {e.severity === "critical" ? (
                      <ShieldAlert className="size-4" aria-hidden />
                    ) : (
                      <KeyRound className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{e.summary}</span>
                    <span className="block text-xs text-ink-tertiary">
                      {e.actor_name || e.actor_email || "System"} ·{" "}
                      {timeFmt.format(new Date(e.created_at))}
                    </span>
                  </span>
                  <Badge variant={e.severity === "critical" ? "danger" : "warning"} size="sm">
                    {e.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
