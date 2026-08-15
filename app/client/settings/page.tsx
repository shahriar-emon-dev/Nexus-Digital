import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { RouteScaffold } from "@/components/shared/RouteScaffold";
import { getMyProfile } from "@/lib/supabase/profile-actions";
import { listFactors } from "@/lib/supabase/mfa-actions";
import { TwoFactorPanel } from "@/components/settings/TwoFactorPanel";

export const metadata: Metadata = { title: "Settings" };

export default async function ClientSettingsPage() {
  const [profile, factors] = await Promise.all([getMyProfile(), listFactors()]);

  // The middleware redirects unauthenticated requests, so a missing profile
  // here means the row was removed underneath a live session.
  if (!profile) {
    return <RouteScaffold title="Settings" route="/client/settings" description="Sign in again to load your profile." />;
  }

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Portal", href: "/client" }, { label: "Settings" }]} />
      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-ink-tertiary">
          Your profile as it appears to the Nexus team across the portal.
        </p>
      </header>

      <div className="max-w-3xl">
        <ProfileForm profile={profile} />
        {/* Spec §15.1 requires 2FA to be available to every user, not only
            admins — a client portal holds invoices and project files. */}
        <div className="mt-8">
          <TwoFactorPanel factors={factors} />
        </div>
      </div>
    </div>
  );
}
