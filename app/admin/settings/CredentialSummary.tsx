import Link from "next/link";
import { ArrowRight, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { credentialStatsFrom } from "@/lib/derive";
import type { Credential } from "@/lib/supabase/credential-actions";

/**
 * Rotation health, not a second key table.
 *
 * Key Management already owns the full interface. Reproducing that table here
 * would leave two screens editing one table and drifting apart — so this is
 * the read-only health view, and every action leads to the one manager.
 */

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function CredentialSummary({ credentials }: { credentials: Credential[] }) {
  const stats = credentialStatsFrom(credentials);
  const attention = credentials
    .filter((c) => c.rotation.state !== "healthy")
    .sort((a, b) => a.rotation.daysRemaining - b.rotation.daysRemaining);

  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No API keys registered"
        description="Third-party credentials are tracked in Key Management, where each one carries a rotation window. Nothing is stored but the provider prefix and the last four characters."
        action={
          <Button size="sm" render={<Link href="/admin/keys" />}>
            Open Key Management
            <ArrowRight />
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {stats.overdue > 0 ? (
        <Alert tone="danger">
          <AlertTitle>
            {stats.overdue} {stats.overdue === 1 ? "key is" : "keys are"} past the rotation window
          </AlertTitle>
          <AlertDescription>
            Issue replacements at the provider and record them in Key
            Management. Rotation state is computed from the clock, so nothing
            here can read as healthy on the day it lapses.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert tone="success">
          <AlertTitle>Every key is inside its rotation window</AlertTitle>
          <AlertDescription>
            {stats.dueSoon > 0
              ? `${stats.dueSoon} approaching the end of the window.`
              : "Nothing needs attention right now."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Registered", value: stats.total },
          { label: "Enabled", value: stats.enabled },
          { label: "In production", value: stats.production },
          { label: "Need rotating", value: stats.overdue + stats.dueSoon },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                {s.label}
              </p>
              <p className="mt-2 font-heading text-3xl font-bold text-ink">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {attention.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-line-subtle">
              {attention.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span
                    className={
                      c.rotation.state === "overdue"
                        ? "grid size-8 shrink-0 place-items-center rounded-lg bg-danger-subtle text-danger"
                        : "grid size-8 shrink-0 place-items-center rounded-lg bg-warning-subtle text-warning"
                    }
                  >
                    {c.rotation.state === "overdue" ? (
                      <ShieldAlert className="size-4" aria-hidden />
                    ) : (
                      <ShieldCheck className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">
                      {c.provider} · {c.name}
                    </span>
                    <span className="block text-xs text-ink-tertiary">
                      Last rotated {dateFmt.format(new Date(c.last_rotated_at))} ·{" "}
                      {c.rotation.state === "overdue"
                        ? `${Math.abs(c.rotation.daysRemaining)} days overdue`
                        : `${c.rotation.daysRemaining} days left`}
                    </span>
                  </span>
                  <Badge variant={c.rotation.state === "overdue" ? "danger" : "warning"} size="sm">
                    {c.environment}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button render={<Link href="/admin/keys" />}>
          Manage keys
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
