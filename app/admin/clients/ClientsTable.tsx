"use client";

import { AlertTriangle, CheckCircle2, Clock, Download, Plus } from "lucide-react";

import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/DataTable";

export type ClientRow = {
  id: string;
  name: string;
  owner: string;
  status: "healthy" | "at-risk" | "onboarding";
  mrr: number;
  projects: number;
  renews: string;
};

/** Status is icon + word, never colour alone. */
const statusMeta = {
  healthy: { label: "Healthy", variant: "success", Icon: CheckCircle2 },
  "at-risk": { label: "At risk", variant: "danger", Icon: AlertTriangle },
  onboarding: { label: "Onboarding", variant: "info", Icon: Clock },
} as const;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const columns: Column<ClientRow>[] = [
  {
    id: "name",
    header: "Client",
    sortBy: (r) => r.name,
    cell: (r) => (
      <div className="flex items-center gap-2.5">
        <Avatar size="xs">
          <AvatarFallback>{initials(r.name)}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-ink">{r.name}</span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortBy: (r) => r.status,
    cell: (r) => {
      const { label, variant, Icon } = statusMeta[r.status];
      return (
        <Badge variant={variant}>
          <Icon aria-hidden />
          {label}
        </Badge>
      );
    },
  },
  { id: "owner", header: "Account lead", sortBy: (r) => r.owner, cell: (r) => r.owner },
  {
    id: "mrr",
    header: "MRR",
    numeric: true,
    sortBy: (r) => r.mrr,
    cell: (r) => money.format(r.mrr),
  },
  {
    id: "projects",
    header: "Projects",
    numeric: true,
    sortBy: (r) => r.projects,
    cell: (r) => r.projects,
  },
  { id: "renews", header: "Renews", sortBy: (r) => r.renews, cell: (r) => r.renews },
];

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  return (
    <DataTable
      data={clients}
      columns={columns}
      getRowId={(r) => r.id}
      selectable
      searchPlaceholder="Search clients…"
      searchBy={(r) => `${r.name} ${r.owner} ${r.status}`}
      emptyTitle="No clients yet"
      emptyDescription="Onboard your first client to see them here."
      toolbar={
        <>
          <Button variant="outline" size="sm">
            <Download />
            Export
          </Button>
          <Button size="sm">
            <Plus />
            Add client
          </Button>
        </>
      }
    />
  );
}
