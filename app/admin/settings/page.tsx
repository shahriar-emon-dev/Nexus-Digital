import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listCredentials } from "@/lib/supabase/credential-actions";
import { getSiteSettings } from "@/lib/supabase/site-settings-actions";
import { CredentialSummary } from "./CredentialSummary";
import { SettingsTabs } from "./SettingsTabs";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [settings, credentials] = await Promise.all([getSiteSettings(), listCredentials()]);

  // The settings row is seeded by migration and pinned to a single id. Its
  // absence means the migration has not run — a deployment fault, not an empty
  // state to design for.
  if (!settings) notFound();

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Settings" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Admin Settings
        </h1>
        <p className="mt-2 max-w-xl text-ink-tertiary">
          Credential health and the global meta tags applied to every public
          page. Keys themselves live in Key Management, so exactly one screen
          owns them.
        </p>
      </header>

      <SettingsTabs
        settings={settings}
        integrations={<CredentialSummary credentials={credentials} />}
      />
    </div>
  );
}
