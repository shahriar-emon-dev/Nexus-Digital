"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input, InputGroup, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  createCredential,
  deleteCredential,
  rotateCredential,
  setCredentialEnabled,
  updateCredential,
  type Credential,
  type CredentialEnvironment,
  type RotationState,
} from "@/lib/supabase/credential-actions";
import { KNOWN_PROVIDERS } from "@/lib/derive";
import type { AuditEntry } from "@/lib/supabase/audit-queries";
import { cn } from "@/lib/utils";

const ENVIRONMENTS: CredentialEnvironment[] = ["production", "staging", "development"];

const envTone: Record<CredentialEnvironment, "brand" | "warning" | "default"> = {
  production: "brand",
  staging: "warning",
  development: "default",
};

const rotationTone: Record<RotationState, "success" | "warning" | "danger"> = {
  healthy: "success",
  "due-soon": "warning",
  overdue: "danger",
};

const rotationLabel: Record<RotationState, string> = {
  healthy: "Healthy",
  "due-soon": "Due soon",
  overdue: "Overdue",
};

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** The only representation of a key that exists on this page. */
const masked = (c: Credential) => `${c.key_prefix}${"•".repeat(8)}${c.last4}`;

export function KeyManagement({
  credentials: initial,
  history,
}: {
  credentials: Credential[];
  /** Audit entries for credentials, keyed by credential id. */
  history: Record<string, AuditEntry[]>;
}) {
  const router = useRouter();
  const toast = useToast();

  const [credentials, setCredentials] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [envFilter, setEnvFilter] = React.useState<string>("all");
  const [stateFilter, setStateFilter] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<Credential | null>(null);
  const [rotating, setRotating] = React.useState<Credential | null>(null);
  const [removing, setRemoving] = React.useState<Credential | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => setCredentials(initial), [initial]);

  useRealtime("admin:credentials", [{ table: "api_credentials" }], () => router.refresh());

  const stats = React.useMemo(
    () => ({
      total: credentials.length,
      enabled: credentials.filter((c) => c.is_enabled).length,
      production: credentials.filter((c) => c.environment === "production").length,
      overdue: credentials.filter((c) => c.rotation.state === "overdue").length,
      dueSoon: credentials.filter((c) => c.rotation.state === "due-soon").length,
    }),
    [credentials]
  );

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return credentials.filter((c) => {
      if (envFilter !== "all" && c.environment !== envFilter) return false;
      if (stateFilter !== "all" && c.rotation.state !== stateFilter) return false;
      if (!q) return true;
      return (
        c.provider.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.environment.includes(q)
      );
    });
  }, [credentials, query, envFilter, stateFilter]);

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

  async function toggle(c: Credential, next: boolean) {
    const previous = credentials;
    setCredentials((cs) => cs.map((x) => (x.id === c.id ? { ...x, is_enabled: next } : x)));
    const result = await setCredentialEnabled(c.id, next);
    if ("error" in result) {
      setCredentials(previous);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function copyReference(c: Credential) {
    // The masked reference is all this page holds. There is deliberately no
    // way to lift a secret from the UI, because the server does not have one.
    try {
      await navigator.clipboard.writeText(masked(c));
      setCopied(c.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats.overdue > 0 && (
        <Alert tone="danger">
          <AlertTitle>
            {stats.overdue} {stats.overdue === 1 ? "key is" : "keys are"} past the rotation window
          </AlertTitle>
          <AlertDescription>
            Issue a replacement at the provider, then record it here. A key is
            never edited in place — the old one is retired and the new one
            registered, so the trail below stays honest.
          </AlertDescription>
        </Alert>
      )}
      {stats.overdue === 0 && stats.dueSoon > 0 && (
        <Alert tone="warning">
          <AlertTitle>
            {stats.dueSoon} {stats.dueSoon === 1 ? "key is" : "keys are"} approaching rotation
          </AlertTitle>
          <AlertDescription>
            Nothing has lapsed yet. Rotating before the window closes avoids an
            outage at the worst moment.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-full sm:max-w-xs">
            <InputGroup
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search provider, name or environment"
              aria-label="Search credentials"
              leading={<Search />}
            />
          </div>

          <Select value={envFilter} onValueChange={(v) => setEnvFilter(v as string)}>
            <SelectTrigger className="w-40" aria-label="Filter by environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All environments</SelectItem>
              {ENVIRONMENTS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e[0].toUpperCase() + e.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as string)}>
            <SelectTrigger className="w-40" aria-label="Filter by rotation state">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any state</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due-soon">Due soon</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setAdding(true)}>
          <Plus />
          Add API key
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {visible.length} of {credentials.length} credentials.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={credentials.length === 0 ? "No API keys registered" : "No matches"}
          description={
            credentials.length === 0
              ? "Register a key to track its rotation window. Only the provider prefix and the last four characters are stored — the secret itself never reaches this database."
              : "No credential matches that search and filter."
          }
          action={
            credentials.length === 0 ? (
              <Button size="sm" onClick={() => setAdding(true)}>
                <Plus />
                Add API key
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setEnvFilter("all");
                  setStateFilter("all");
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
                  Registered API credentials with their environment, masked
                  reference and rotation state.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Provider</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Name</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Environment</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Key</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Rotation</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Enabled</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((c) => (
                    <tr
                      key={c.id}
                      className={cn(
                        "transition-colors hover:bg-surface-sunken/40",
                        !c.is_enabled && "opacity-60"
                      )}
                    >
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <span className="flex items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
                            <KeyRound className="size-4" aria-hidden />
                          </span>
                          <span className="text-sm font-semibold text-ink">{c.provider}</span>
                        </span>
                      </th>

                      <td className="px-3 py-3">
                        <span className="block text-sm text-ink">{c.name}</span>
                        {c.owner && (
                          <span className="block text-xs text-ink-tertiary">
                            {c.owner.full_name || c.owner.email}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <Badge variant={envTone[c.environment]} size="sm">
                          {c.environment}
                        </Badge>
                      </td>

                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1.5">
                          <code className="rounded-md bg-surface-sunken px-2 py-1 font-mono text-xs text-ink-secondary">
                            {masked(c)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => copyReference(c)}
                            aria-label={`Copy masked reference for ${c.name}`}
                          >
                            {copied === c.id ? <Check className="text-success" /> : <Copy />}
                          </Button>
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="flex flex-col gap-1">
                          <Badge variant={rotationTone[c.rotation.state]} size="sm">
                            {c.rotation.state === "overdue" ? <ShieldAlert aria-hidden /> : <Clock aria-hidden />}
                            {rotationLabel[c.rotation.state]}
                          </Badge>
                          <span className="text-xs text-ink-tertiary">
                            {c.rotation.state === "overdue"
                              ? `${Math.abs(c.rotation.daysRemaining)} days past due`
                              : `${c.rotation.daysRemaining} days left`}
                            {" · "}
                            rotated {dateFmt.format(new Date(c.last_rotated_at))}
                          </span>
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <Switch
                          checked={c.is_enabled}
                          onCheckedChange={(v) => toggle(c, Boolean(v))}
                          aria-label={`${c.is_enabled ? "Disable" : "Enable"} ${c.name}`}
                        />
                      </td>

                      <td className="px-3 py-3">
                        <span className="flex justify-end gap-1">
                          <Button
                            variant={c.rotation.state === "overdue" ? "default" : "ghost"}
                            size="xs"
                            onClick={() => setRotating(c)}
                          >
                            <RefreshCw />
                            Rotate
                          </Button>
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-ink-tertiary">
        {stats.enabled} active of {stats.total} · {stats.production} in production
      </p>

      {/* ------------------------------------------------------------ add -- */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              if (await run(() => createCredential(form), "Key registered")) setAdding(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Register an API key</DialogTitle>
              <DialogDescription>
                The key is read once to take its last four characters, then
                discarded. It is never stored, logged or sent back to a browser.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    name="provider"
                    list="known-providers"
                    required
                    placeholder="Stripe"
                  />
                  <datalist id="known-providers">
                    {KNOWN_PROVIDERS.map((p) => (
                      <option key={p.name} value={p.name} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="Production gateway" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="environment">Environment</Label>
                  <select
                    id="environment"
                    name="environment"
                    defaultValue="production"
                    className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                  >
                    {ENVIRONMENTS.map((e) => (
                      <option key={e} value={e}>
                        {e[0].toUpperCase() + e.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rotationDays">Rotate every (days)</Label>
                  <Input
                    id="rotationDays"
                    name="rotationDays"
                    type="number"
                    min={1}
                    max={3650}
                    defaultValue={90}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="secret">API key</Label>
                <Input
                  id="secret"
                  name="secret"
                  type="password"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="sk_live_…"
                />
                <p className="text-xs text-ink-tertiary">
                  Paste the whole key. Only the prefix and last four characters
                  are kept.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} maxLength={500} />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Plus />}
                Register key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------- rotate -- */}
      <Dialog open={rotating !== null} onOpenChange={(o) => !o && setRotating(null)}>
        <DialogContent>
          {rotating && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const secret = String(new FormData(e.currentTarget).get("secret") ?? "");
                if (await run(() => rotateCredential(rotating.id, secret), "Rotation recorded")) {
                  setRotating(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Record a rotation</DialogTitle>
                <DialogDescription>
                  This app cannot rotate a key at {rotating.provider} on your
                  behalf — issue the replacement there first, then paste it here
                  so the record matches the key actually in use.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="rounded-lg border border-line-subtle bg-surface-sunken p-3 text-sm">
                  <span className="text-ink-tertiary">Replacing</span>{" "}
                  <code className="font-mono text-ink">{masked(rotating)}</code>
                  <span className="mt-1 block text-xs text-ink-tertiary">
                    Last rotated {dateFmt.format(new Date(rotating.last_rotated_at))} ·{" "}
                    {rotating.rotation.ageDays} days ago
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rotate-secret">New API key</Label>
                  <Input
                    id="rotate-secret"
                    name="secret"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Leave empty to only reset the clock"
                  />
                </div>

                {(history[rotating.id] ?? []).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
                      History
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {(history[rotating.id] ?? []).slice(0, 6).map((h) => (
                        <li key={h.id} className="flex justify-between gap-3 text-xs">
                          <span className="text-ink-secondary">{h.summary}</span>
                          <span className="shrink-0 text-ink-tertiary">
                            {dateFmt.format(new Date(h.created_at))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
                  Record rotation
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------- edit -- */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                if (await run(() => updateCredential(editing.id, form), "Details saved")) {
                  setEditing(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{editing.provider} · {editing.name}</DialogTitle>
                <DialogDescription>
                  The key itself cannot be edited. To change it, record a
                  rotation.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editing.name} required />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-env">Environment</Label>
                    <select
                      id="edit-env"
                      name="environment"
                      defaultValue={editing.environment}
                      className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                    >
                      {ENVIRONMENTS.map((e) => (
                        <option key={e} value={e}>
                          {e[0].toUpperCase() + e.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-rotation">Rotate every (days)</Label>
                    <Input
                      id="edit-rotation"
                      name="rotationDays"
                      type="number"
                      min={1}
                      max={3650}
                      defaultValue={editing.rotation_interval_days}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    rows={3}
                    maxLength={500}
                    defaultValue={editing.notes ?? ""}
                  />
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

      {/* --------------------------------------------------------- delete -- */}
      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          {removing && (
            <>
              <DialogHeader>
                <DialogTitle>Delete this record?</DialogTitle>
                <DialogDescription>
                  This removes {removing.provider} · {removing.name} from the
                  registry. It does <strong>not</strong> revoke the key at the
                  provider — do that there, or the key stays live and untracked.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => deleteCredential(removing.id), "Record deleted")) {
                      setRemoving(null);
                    }
                  }}
                >
                  <Trash2 />
                  Delete record
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
