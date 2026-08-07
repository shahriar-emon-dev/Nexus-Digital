"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Trash2, TrendingUp, Users } from "lucide-react";

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
  deleteLead,
  setLeadStatus,
  updateLead,
  type Lead,
  type LeadPipeline,
  type LeadStatus,
} from "@/lib/supabase/lead-actions";
import { cn } from "@/lib/utils";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

const statusTone: Record<LeadStatus, "info" | "warning" | "brand" | "success" | "default"> = {
  new: "info",
  contacted: "warning",
  qualified: "brand",
  won: "success",
  lost: "default",
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

export function LeadsTable({
  initial,
  pipeline,
  assignees,
}: {
  initial: Lead[];
  pipeline: LeadPipeline;
  assignees: { id: string; full_name: string; email: string }[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [leads, setLeads] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState<Lead | null>(null);
  const [removing, setRemoving] = React.useState<Lead | null>(null);

  React.useEffect(() => setLeads(initial), [initial]);

  /** An enquiry submitted from the public site lands here without a reload. */
  useRealtime("admin:leads", [{ table: "leads" }], () => router.refresh());

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (!q) return true;
      return (
        l.full_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.reference ?? "").toLowerCase().includes(q) ||
        (l.service_intent ?? "").toLowerCase().includes(q)
      );
    });
  }, [leads, query, status]);

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
        <StatCard label="Open leads" value={String(pipeline.open)} icon={Users} />
        {/* Null until something has been decided: counting open enquiries as
            failures would understate the rate and move on every new arrival. */}
        <StatCard
          label="Conversion rate"
          value={pipeline.conversionPct === null ? "—" : `${pipeline.conversionPct}%`}
          caption={
            pipeline.conversionPct === null
              ? "Nothing won or lost yet"
              : `${pipeline.won} won of ${pipeline.total}`
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Open pipeline"
          value={money.format(pipeline.openValue)}
          caption={
            pipeline.unsized > 0
              ? `${pipeline.unsized} not yet sized — excluded`
              : "Every open lead is sized"
          }
        />
        <StatCard label="Won" value={money.format(pipeline.wonValue)} />
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
            placeholder="Search name, company, reference…"
            aria-label="Search leads"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-ink-tertiary" aria-live="polite">
          {visible.length} of {leads.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={leads.length === 0 ? "No enquiries yet" : "No matches"}
          description={
            leads.length === 0
              ? "Enquiries submitted from the contact page arrive here immediately, each with the reference the visitor was shown."
              : "No lead matches that search and filter."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[62rem] border-collapse text-left">
                <caption className="sr-only">
                  Inbound leads with their status, service intent and value.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Lead / Company</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Contact</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Service intent</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Value</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((l) => (
                    <tr
                      key={l.id}
                      className={cn(
                        "transition-colors hover:bg-surface-sunken/40",
                        l.status === "lost" && "opacity-60"
                      )}
                    >
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <span className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-xs font-bold text-brand-subtle-fg">
                            {initials(l.full_name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink">
                              {l.full_name}
                            </span>
                            <span className="block truncate text-xs text-ink-tertiary">
                              {l.company ?? "—"} · {l.reference}
                            </span>
                          </span>
                        </span>
                      </th>

                      <td className="px-3 py-3">
                        <span className="block truncate text-sm text-ink-secondary">{l.email}</span>
                        <span className="block truncate text-xs text-ink-tertiary">
                          {l.phone ?? l.source}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <Select
                          value={l.status}
                          onValueChange={(v) =>
                            run(() => setLeadStatus(l.id, v as LeadStatus), "Status updated")
                          }
                        >
                          <SelectTrigger size="sm" className="w-32" aria-label={`Status for ${l.full_name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s[0].toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="px-3 py-3 text-sm text-ink-secondary">
                        {l.service?.title ?? l.service_intent ?? (
                          <span className="text-ink-tertiary">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {l.assignee ? (
                          <span className="flex items-center gap-2">
                            <Avatar className="size-6">
                              {l.assignee.avatar_url && (
                                <AvatarImage src={l.assignee.avatar_url} alt="" />
                              )}
                              <AvatarFallback className="text-[0.625rem]">
                                {initials(l.assignee.full_name || l.assignee.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm text-ink-secondary">
                              {l.assignee.full_name || l.assignee.email}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-ink-tertiary">Unassigned</span>
                        )}
                      </td>

                      <td data-tabular className="px-3 py-3 text-right text-sm">
                        {/* "TBD" rather than $0 — an unsized lead is not a
                            worthless one, and the forecast excludes it. */}
                        {l.estimated_value === null ? (
                          <span className="text-ink-tertiary italic">TBD</span>
                        ) : (
                          <span className="text-ink">{money.format(Number(l.estimated_value))}</span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <span className="flex justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => setEditing(l)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-danger"
                            onClick={() => setRemoving(l)}
                            aria-label={`Delete ${l.full_name}`}
                          >
                            <Trash2 />
                          </Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------ edit -- */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                if (await run(() => updateLead(editing.id, form), "Lead updated")) {
                  setEditing(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{editing.full_name}</DialogTitle>
                <DialogDescription>
                  {editing.reference} · submitted {dateFmt.format(new Date(editing.created_at))} via{" "}
                  {editing.source}
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                {editing.brief && (
                  <div className="rounded-lg border border-line-subtle bg-surface-sunken p-3">
                    <p className="text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
                      What they wrote
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                      {editing.brief}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="l-value">Estimated value</Label>
                    <Input
                      id="l-value"
                      name="estimatedValue"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Not sized yet"
                      defaultValue={editing.estimated_value ?? ""}
                    />
                    <p className="text-xs text-ink-tertiary">
                      Leave empty rather than entering 0 — an unsized lead is
                      excluded from the forecast, a zero drags it down.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="l-assignee">Owner</Label>
                    <select
                      id="l-assignee"
                      name="assigneeId"
                      defaultValue={editing.assignee_id ?? ""}
                      className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                    >
                      <option value="">Unassigned</option>
                      {assignees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.full_name || a.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="l-intent">Service intent</Label>
                  <Input
                    id="l-intent"
                    name="serviceIntent"
                    defaultValue={editing.service_intent ?? ""}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="l-notes">Internal notes</Label>
                  <Textarea id="l-notes" name="notes" rows={3} defaultValue={editing.notes ?? ""} />
                </div>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          {removing && (
            <>
              <DialogHeader>
                <DialogTitle>Delete {removing.reference}?</DialogTitle>
                <DialogDescription>
                  This removes {removing.full_name}&apos;s enquiry and what they
                  wrote. Marking it lost keeps the record and the conversion
                  history.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="justify-between">
                <Button
                  variant="outline"
                  disabled={busy || removing.status === "lost"}
                  onClick={async () => {
                    if (await run(() => setLeadStatus(removing.id, "lost"), "Marked lost")) {
                      setRemoving(null);
                    }
                  }}
                >
                  Mark lost instead
                </Button>
                <div className="flex gap-2">
                  <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={async () => {
                      if (await run(() => deleteLead(removing.id), "Lead deleted")) {
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
