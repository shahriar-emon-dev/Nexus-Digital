import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { KeyManagement } from "@/components/admin/KeyManagement";
import { listCredentials } from "@/lib/supabase/credential-actions";
import { listAuditFor } from "@/lib/supabase/audit-queries";

export const metadata: Metadata = { title: "Key Management" };

export default async function AdminKeyManagementPage() {
  const credentials = await listCredentials();

  // Per-key history, fetched once here rather than by each row. The audit
  // trail is written by triggers on api_credentials, so this reflects changes
  // made in the SQL editor as faithfully as changes made on this screen.
  const entries = await Promise.all(
    credentials.map(async (c) => [c.id, await listAuditFor("api_credential", c.id, 10)] as const)
  );

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[{ label: "Command Center", href: "/admin" }, { label: "Key Management" }]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Key Management
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every third-party credential the platform depends on, with its
          rotation window. Secrets are not stored here — only the provider
          prefix and the final four characters, which is enough to identify a
          key and useless to anyone who steals this database.
        </p>
      </header>

      <KeyManagement credentials={credentials} history={Object.fromEntries(entries)} />
    </div>
  );
}
