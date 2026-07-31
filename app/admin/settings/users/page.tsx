import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { listProfiles } from "@/lib/supabase/profile-actions";
import type { Role } from "@/lib/supabase/types";
import { UsersTable } from "./UsersTable";

export const metadata: Metadata = {
  title: "User Management",
  description: "Accounts, portal assignment and role grants.",
};

export default async function AdminSettingsUsersPage() {
  const supabase = await createClient();

  const [{ data: roles }, profiles, { data: auth }] = await Promise.all([
    supabase.from("roles").select("*").order("name"),
    listProfiles(),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Users" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          User Management
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every account on the platform. Portal decides which surface someone can
          reach; role decides what they can do once inside. Both are enforced by
          the database, not only by this screen.
        </p>
      </header>

      <UsersTable
        initialProfiles={profiles}
        roles={(roles as Role[] | null) ?? []}
        currentUserId={auth.user?.id ?? ""}
      />
    </div>
  );
}
