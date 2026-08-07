import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { healthTone } from "@/lib/client-portal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Billing Entities" };

/**
 * The organisations on this account.
 *
 * Scoped under /client on purpose: "Clients" in the billing design's rail meant
 * the account's own billing entities, not other tenants. RLS returns only the
 * caller's organisation, so this can never become a tenant list.
 */
export default async function ClientEntitiesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("organizations")
    .select("id, name, industry, tier, health, website, renews_on")
    .order("name");

  const orgs = data ?? [];

  return (
    <>
      <DashboardHeader
        title="Billing Entities"
        description="The organisations invoices are raised against."
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Clients" }]}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-5 py-6 lg:px-8">
        {orgs.length === 0 ? (
          <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
            <Building2 className="size-8 text-ink-tertiary" aria-hidden />
            <h2 className="font-heading text-xl font-semibold text-ink">
              No entity on your account
            </h2>
            <p className="max-w-sm text-ink-tertiary">
              Your account is not linked to a billing organisation yet. Your account manager can
              set that up.
            </p>
          </Card>
        ) : (
          orgs.map((org) => {
            const health = org.health ? healthTone[org.health as keyof typeof healthTone] : null;
            return (
              <Card key={org.id} variant="glass" className="gap-4 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-ink">{org.name}</h2>
                    <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
                      {org.industry ?? "No industry recorded"}
                      {org.tier && ` · ${org.tier}`}
                    </p>
                  </div>
                  {health && <Badge variant={health.tone}>{health.label}</Badge>}
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                      Website
                    </dt>
                    <dd className="mt-1 text-ink">
                      {org.website ? (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none"
                        >
                          {org.website}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                      Renews
                    </dt>
                    <dd data-tabular className="mt-1 text-ink">
                      {org.renews_on ?? "—"}
                    </dd>
                  </div>
                </dl>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
