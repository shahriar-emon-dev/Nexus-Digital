import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listAccountManagers, listClients } from "@/lib/supabase/client-actions";
import { ClientsTable } from "./ClientsTable";

export const metadata: Metadata = { title: "Client Directory" };

export default async function AdminClientsPage() {
  const [clients, managers] = await Promise.all([listClients(), listAccountManagers()]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Clients" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Client Directory
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Revenue and project counts are read from the invoice ledger and the
          project table, never stored on the client record — so a figure here
          can never disagree with the invoices it came from.
        </p>
      </header>

      <ClientsTable initial={clients} managers={managers} />
    </div>
  );
}
