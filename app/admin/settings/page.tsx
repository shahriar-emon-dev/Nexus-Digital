import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SettingsTabs } from "./SettingsTabs";

export const metadata: Metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <>
      

      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <Breadcrumbs items={[
          { label: "Command Center", href: "/admin" },
          { label: "Settings" },
        ]} />
        <header>
          <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
            Admin Settings
          </h1>
          <p className="mt-2 max-w-xl text-ink-tertiary">
            Integrations, API credentials and the global meta tags applied to
            every public page.
          </p>
        </header>

        <SettingsTabs />
      </div>
    </>
  );
}
