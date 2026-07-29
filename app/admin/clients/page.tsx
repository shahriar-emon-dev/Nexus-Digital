import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { ClientsTable, type ClientRow } from "./ClientsTable";

export const metadata: Metadata = { title: "Client Directory" };

const clients: ClientRow[] = [
  { id: "c1", name: "Northwind Retail", owner: "Dez Okafor", status: "healthy", mrr: 42000, projects: 3, renews: "12 Nov 2026" },
  { id: "c2", name: "Halcyon Health", owner: "Mira Kaur", status: "at-risk", mrr: 31500, projects: 2, renews: "03 Sep 2026" },
  { id: "c3", name: "Lumen Studio", owner: "Dez Okafor", status: "healthy", mrr: 18750, projects: 1, renews: "28 Jan 2027" },
  { id: "c4", name: "Ardent Logistics", owner: "Sam Ellery", status: "onboarding", mrr: 26000, projects: 2, renews: "15 Mar 2027" },
  { id: "c5", name: "Verity Financial", owner: "Mira Kaur", status: "healthy", mrr: 38400, projects: 4, renews: "07 Dec 2026" },
  { id: "c6", name: "Orient Foods", owner: "Sam Ellery", status: "at-risk", mrr: 12800, projects: 1, renews: "22 Aug 2026" },
  { id: "c7", name: "Kestrel Energy", owner: "Dez Okafor", status: "healthy", mrr: 14750, projects: 2, renews: "09 Feb 2027" },
  { id: "c8", name: "Nova Fintech", owner: "Mira Kaur", status: "healthy", mrr: 24500, projects: 3, renews: "19 Apr 2027" },
];

export default function AdminClientsPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-5 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[2.5rem] leading-[1.2] font-bold tracking-tight text-ink">
            Client Directory
          </h1>
          <p className="mt-2 text-ink-tertiary">
            Sorted by revenue. Two accounts are flagged at risk.
          </p>
        </div>
        <Badge variant="warning">2 need attention</Badge>
      </div>

      <ClientsTable clients={clients} />
    </div>
  );
}
