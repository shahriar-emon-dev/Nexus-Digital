import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { RouteScaffold } from "@/components/shared/RouteScaffold";
import { getMyProfile } from "@/lib/supabase/profile-actions";

export const metadata: Metadata = { title: "Settings" };

export default async function StaffSettingsPage() {
  const profile = await getMyProfile();

  // The middleware redirects unauthenticated requests, so a missing profile
  // here means the row was removed underneath a live session.
  if (!profile) {
    return <RouteScaffold title="Settings" route="/staff/settings" description="Sign in again to load your profile." />;
  }

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Workspace", href: "/staff" }, { label: "Settings" }]} />
      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-ink-tertiary">
          Your profile as it appears to colleagues and clients across the workspace.
        </p>
      </header>

      <div className="max-w-3xl">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
