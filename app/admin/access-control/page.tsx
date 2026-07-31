import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AccessControlConsole } from "./AccessControlConsole";

export const metadata: Metadata = {
  title: "Access Control",
  description: "Roles, permissions, authentication and network policy.",
};

export default function AdminAccessControlPage() {
  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Access Control" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Security Policy Engine
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Authoritative control for global access governance. Grants defined here
          gate both the permission matrix and route access across the admin surface.
        </p>
      </header>

      <AccessControlConsole />
    </div>
  );
}
