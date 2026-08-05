"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Check,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  createOrganization,
  deleteOrganization,
  updateOrganization,
  type AccountHealth,
  type ClientAccount,
} from "@/lib/supabase/client-actions";
import { cn } from "@/lib/utils";

const HEALTHS: AccountHealth[] = ["onboarding", "healthy", "at-risk", "churned"];

/** Status is icon + word, never colour alone. */
const healthMeta: Record<
  AccountHealth,
  { label: string; variant: "success" | "danger" | "info" | "default"; Icon: typeof CheckCircle2 }
> = {
  healthy: { label: "Healthy", variant: "success", Icon: CheckCircle2 },
  "at-risk": { label: "At risk", variant: "danger", Icon: AlertTriangle },
  onboarding: { label: "Onboarding", variant: "info", Icon: Clock },
  churned: { label: "Churned", variant: "default", Icon: XCircle },
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type SortKey = "name" | "revenue" | "projects" | "renews";

export function ClientsTable({
  initial,
  managers,
}: {
  initial: ClientAccount[];
  managers: { id: string; full_name: string; email: string }[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [clients, setClients] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [health, setHealth] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("revenue");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<ClientAccount | null>(null);
  const [removing, setRemoving] = React.useState<ClientAccount | null>(null);

  React.useEffect(() => setClients(initial), [initial]);

  // Invoices move the revenue column, so a payment recorded elsewhere has to
  // reach this table too.
  useRealtime(
    "admin:clients",
    [{ table: "organizations" }, { table: "invoices" }, { table: "invoice_payments" }],
    () => router.refresh()
  );

  const summary = React.useMemo(
    () => ({
      total: clients.length,
      atRisk: clients.filter((c) => c.health === "at-risk").length,
      monthly: clients.reduce((n, c) => n + c.revenue.monthlyAverage, 0),
      outstanding: clients.reduce((n, c) => n + c.revenue.outstanding, 0),
    }),
    [clients]
  );

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = clients.filter((c) => {
      if (health !== "all" && c.health !== health) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.industry ?? "").toLowerCase().includes(q) ||
        (c.manager?.full_name ?? "").toLowerCase().includes(q)
      );
    });

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "revenue":
          return b.revenue.monthlyAverage - a.revenue.monthlyAverage;
        case "projects":
          return b.projects.total - a.projects.total;
        case "renews":
          // Undated accounts sort last rather than to the top.
          return (a.renews_on ?? "9999").localeCompare(b.renews_on ?? "9999");
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [clients, query, health, sort]);

  async function run(fn: () => Promise<{ ok: true } | { error: string }>, message: string) {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return false;
    }
    toast.add({ title: message, type: "success" });
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clients" value={String(summary.total)} icon={Building2} />
        <StatCard
          label="Needs attention"
          value={String(summary.atRisk)}
          caption={summary.atRisk === 0 ? "No account flagged" : "Flagged at risk"}
        />
        <StatCard
          label="Monthly average"
          value={money.format(summary.monthly)}
          caption="Trailing twelve months ÷ 12"
        />
        <StatCard label="Outstanding" value={money.format(summary.outstanding)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, industry or lead…"
            aria-label="Search clients"
            className="pl-9"
          />
        </div>

        <Select value={health} onValueChange={(v) => setHealth(v as string)}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {HEALTHS.map((h) => (
              <SelectItem key={h} value={h}>
                {healthMeta[h].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-40" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="projects">Projects</SelectItem>
            <SelectItem value="renews">Renewal date</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setCreating(true)}>
          <Plus />
          Add client
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} of {clients.length} clients.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={clients.length === 0 ? "No clients yet" : "No matches"}
          description={
            clients.length === 0
              ? "A client owns its projects, invoices and portal users. Revenue on this screen is read from the invoice ledger, never typed in."
              : "No client matches that search and filter."
          }
          action={
            clients.length === 0 ? (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus />
                Add client
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setHealth("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[62rem] border-collapse text-left">
                <caption className="sr-only">
                  Clients with their account lead, revenue and project counts.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Client</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Account lead</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Monthly avg.</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Outstanding</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Projects</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Renews</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((c) => {
                    const meta = healthMeta[c.health];
                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          "transition-colors hover:bg-surface-sunken/40",
                          c.health === "churned" && "opacity-60"
                        )}
                      >
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="flex items-center gap-2.5">
                            <Avatar className="size-8">
                              <AvatarFallback>{initials(c.name)}</AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {c.name}
                              </span>
                              <span className="block truncate text-xs text-ink-tertiary">
                                {c.industry ?? "—"}
                                {c.contacts > 0
                                  ? ` · ${c.contacts} ${c.contacts === 1 ? "contact" : "contacts"}`
                                  : ""}
                              </span>
                            </span>
                          </span>
                        </th>

                        <td className="px-3 py-3">
                          <Badge variant={meta.variant} size="sm">
                            <meta.Icon aria-hidden />
                            {meta.label}
                          </Badge>
                        </td>

                        <td className="px-3 py-3">
                          {c.manager ? (
                            <span className="flex items-center gap-2">
                              <Avatar className="size-6">
                                {c.manager.avatar_url && (
                                  <AvatarImage src={c.manager.avatar_url} alt="" />
                                )}
                                <AvatarFallback className="text-[0.625rem]">
                                  {initials(c.manager.full_name || c.manager.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm text-ink-secondary">
                                {c.manager.full_name || c.manager.email}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-ink-tertiary">Unassigned</span>
                          )}
                        </td>

                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink">
                          {c.revenue.invoiceCount === 0 ? (
                            <span className="text-ink-tertiary">—</span>
                          ) : (
                            money.format(c.revenue.monthlyAverage)
                          )}
                        </td>

                        <td
                          data-tabular
                          className={cn(
                            "px-3 py-3 text-right text-sm",
                            c.revenue.outstanding > 0 ? "font-semibold text-ink" : "text-ink-tertiary"
                          )}
                        >
                          {money.format(c.revenue.outstanding)}
                        </td>

                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {c.projects.total}
                          {c.projects.active !== c.projects.total && (
                            <span className="text-ink-tertiary"> ({c.projects.active} active)</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-sm text-ink-secondary">
                          {c.renews_on ? (
                            dateFmt.format(new Date(c.renews_on))
                          ) : (
                            <span className="text-ink-tertiary">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditing(c)}
                              aria-label={`Edit ${c.name}`}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-danger"
                              onClick={() => setRemoving(c)}
                              aria-label={`Delete ${c.name}`}
                            >
                              <Trash2 />
                            </Button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ClientDialog
        open={creating}
        onOpenChange={setCreating}
        managers={managers}
        busy={busy}
        title="Add a client"
        description="Creates the account that owns projects, invoices and portal users."
        submitLabel="Add client"
        onSubmit={async (form) => {
          if (await run(() => createOrganization(form), "Client added")) setCreating(false);
        }}
      />

      {editing && (
        <ClientDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          managers={managers}
          busy={busy}
          client={editing}
          title={`Edit ${editing.name}`}
          description="Revenue and project counts are read from the ledger and cannot be edited here."
          submitLabel="Save changes"
          onSubmit={async (form) => {
            if (await run(() => updateOrganization(editing.id, form), "Client saved")) {
              setEditing(null);
            }
          }}
        />
      )}

      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          {removing && (
            <>
              <DialogHeader>
                <DialogTitle>Delete {removing.name}?</DialogTitle>
                <DialogDescription>
                  {removing.projects.total > 0 || removing.revenue.invoiceCount > 0
                    ? `This client has ${removing.projects.total} project(s) and ${removing.revenue.invoiceCount} invoice(s). Deletion is refused while either exists — mark them churned instead.`
                    : "This client has no projects or invoices, so nothing else is lost."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="justify-between">
                <Button
                  variant="outline"
                  disabled={busy || removing.health === "churned"}
                  onClick={async () => {
                    const form = new FormData();
                    form.set("name", removing.name);
                    form.set("industry", removing.industry ?? "");
                    form.set("health", "churned");
                    form.set("managerId", removing.account_manager_id ?? "");
                    form.set("renewsOn", removing.renews_on ?? "");
                    form.set("website", removing.website ?? "");
                    form.set("notes", removing.notes ?? "");
                    if (await run(() => updateOrganization(removing.id, form), "Marked churned")) {
                      setRemoving(null);
                    }
                  }}
                >
                  Mark churned
                </Button>
                <div className="flex gap-2">
                  <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={async () => {
                      if (await run(() => deleteOrganization(removing.id), "Client deleted")) {
                        setRemoving(null);
                      }
                    }}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** One form for add and edit — two would drift the moment a field is added. */
function ClientDialog({
  open,
  onOpenChange,
  managers,
  client,
  title,
  description,
  submitLabel,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  managers: { id: string; full_name: string; email: string }[];
  client?: ClientAccount;
  title: string;
  description: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit(new FormData(e.currentTarget));
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="c-name">Client name</Label>
                <Input id="c-name" name="name" required defaultValue={client?.name} maxLength={120} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-industry">Industry</Label>
                <Input id="c-industry" name="industry" defaultValue={client?.industry ?? ""} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-health">Status</Label>
                <select
                  id="c-health"
                  name="health"
                  defaultValue={client?.health ?? "onboarding"}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  {HEALTHS.map((h) => (
                    <option key={h} value={h}>
                      {healthMeta[h].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-manager">Account lead</Label>
                <select
                  id="c-manager"
                  name="managerId"
                  defaultValue={client?.account_manager_id ?? ""}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  <option value="">Unassigned</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-renews">Renews on</Label>
                <Input id="c-renews" name="renewsOn" type="date" defaultValue={client?.renews_on ?? ""} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="c-website">Website</Label>
                <Input
                  id="c-website"
                  name="website"
                  type="url"
                  placeholder="https://"
                  defaultValue={client?.website ?? ""}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-notes">Notes</Label>
              <Textarea id="c-notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
