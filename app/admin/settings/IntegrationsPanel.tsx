"use client";

import * as React from "react";
import {
  Check,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ageInDays,
  environments,
  environmentTone,
  integrations,
  integrationStats,
  maskedKey,
  needsRotation,
  providerById,
  providers,
  type Environment,
  type Integration,
  type ProviderId,
} from "@/lib/integrations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
} from "@/components/ui/dialog";
import { Input, InputGroup } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function IntegrationsPanel() {
  const [query, setQuery] = React.useState("");
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(integrations.map((i) => [i.id, i.enabled]))
  );
  const [adding, setAdding] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Integration | null>(null);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return integrations;
    return integrations.filter((integration) => {
      const provider = providerById(integration.providerId);
      return (
        integration.label.toLowerCase().includes(q) ||
        (provider?.name.toLowerCase().includes(q) ?? false) ||
        integration.environment.toLowerCase().includes(q)
      );
    });
  }, [query]);

  async function copyReference(integration: Integration) {
    // Only the masked reference is ever on this page, so this is all there is
    // to copy — there is deliberately no way to lift the secret from the UI.
    try {
      await navigator.clipboard.writeText(maskedKey(integration));
      setCopied(integration.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {integrationStats.stale > 0 && (
        <Alert tone="warning">
          <AlertTitle>
            {integrationStats.stale} key{integrationStats.stale === 1 ? "" : "s"} past the
            rotation window
          </AlertTitle>
          <AlertDescription>
            Rotate these at the provider, then replace them here. A key is never
            editable in place — issue a new one and retire the old.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Search + add ────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-sm">
          <InputGroup
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search provider, name or environment"
            aria-label="Search integrations"
            leading={<Search />}
          />
        </div>

        <Button
          onClick={() => setAdding(true)}
          className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
        >
          <Plus />
          Add API key
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {rows.length} of {integrations.length} integrations.
      </p>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card variant="glass" className="min-w-0 gap-0 overflow-hidden rounded-2xl">
        <div className="scrollbar-none min-w-0 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <caption className="sr-only">
              Connected third-party integrations. Key values are masked and cannot
              be revealed from this screen.
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken/60">
                {["Provider", "Name", "Environment", "Key", "Age", "Enabled", "Actions"].map(
                  (head, i) => (
                    <th
                      key={head}
                      scope="col"
                      className={cn(
                        "px-5 py-4 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase",
                        i === 5 && "text-center",
                        i === 6 && "text-right"
                      )}
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-line-subtle">
              {rows.map((integration) => {
                const provider = providerById(integration.providerId);
                const stale = needsRotation(integration);
                const age = ageInDays(integration.createdOn);
                const on = enabled[integration.id];

                return (
                  <tr
                    key={integration.id}
                    className="transition-colors duration-(--duration-fast) hover:bg-surface-sunken/60"
                  >
                    <th scope="row" className="px-5 py-4 text-left font-normal">
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand">
                          <KeyRound className="size-4" aria-hidden />
                        </span>
                        <span className="font-semibold text-ink">{provider?.name}</span>
                      </span>
                    </th>

                    <td className="px-5 py-4 text-ink-secondary">{integration.label}</td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={environmentTone[integration.environment]}
                        size="sm"
                        className="tracking-wider uppercase"
                      >
                        {integration.environment}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <code
                        data-tabular
                        className="rounded bg-surface-sunken px-2 py-1 font-mono text-[0.75rem] text-ink-tertiary"
                      >
                        {maskedKey(integration)}
                      </code>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "text-[0.8125rem]",
                          stale ? "font-semibold text-warning" : "text-ink-tertiary"
                        )}
                      >
                        <span data-tabular>{age}</span> days
                      </span>
                      {stale && (
                        <span className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-warning">
                          <ShieldAlert className="size-3" aria-hidden />
                          Rotate
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex justify-center">
                        <Switch
                          checked={on}
                          onCheckedChange={(next) =>
                            // TODO: PATCH the integration once the API exists.
                            setEnabled((prev) => ({ ...prev, [integration.id]: next }))
                          }
                          aria-label={`${on ? "Disable" : "Enable"} ${provider?.name} ${integration.label}`}
                        />
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Copy masked reference for ${integration.label}`}
                                onClick={() => copyReference(integration)}
                              >
                                {copied === integration.id ? (
                                  <Check className="text-success" />
                                ) : (
                                  <Copy />
                                )}
                              </Button>
                            }
                          />
                          <TooltipContent>
                            {copied === integration.id ? "Copied" : "Copy masked reference"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Rename ${integration.label}`}
                              >
                                <Pencil />
                              </Button>
                            }
                          />
                          <TooltipContent>Rename</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Revoke ${integration.label}`}
                                onClick={() => setPendingDelete(integration)}
                              >
                                <Trash2 className="text-danger" />
                              </Button>
                            }
                          />
                          <TooltipContent>Revoke</TooltipContent>
                        </Tooltip>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-6 py-16 text-center text-ink-tertiary">
            Nothing matches “{query}”.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line bg-surface-sunken/60 px-5 py-4 text-[0.8125rem] text-ink-tertiary">
          <span>
            <span data-tabular className="font-semibold text-ink">
              {integrationStats.active}
            </span>{" "}
            active of{" "}
            <span data-tabular className="font-semibold text-ink">
              {integrationStats.total}
            </span>
          </span>
          <span>
            <span data-tabular className="font-semibold text-brand">
              {integrationStats.production}
            </span>{" "}
            in production
          </span>
        </div>
      </Card>

      <AddKeyDrawer open={adding} onOpenChange={setAdding} />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Revoke this key?</DialogTitle>
            <DialogDescription>
              {pendingDelete &&
                `${providerById(pendingDelete.providerId)?.name} — ${pendingDelete.label}`}
            </DialogDescription>
          </DialogHeader>
          <Alert tone="danger">
            <AlertTitle>This cannot be undone</AlertTitle>
            <AlertDescription>
              Anything using this key stops working immediately. Revoke it at the
              provider too, or it remains valid outside this app.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" render={<DialogClose />}>
              Cancel
            </Button>
            {/* TODO: enable once the revoke endpoint exists. */}
            <Button variant="destructive" disabled>
              Revoke key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Key creation.
 *
 * The design pre-filled this drawer with a complete production secret and put a
 * reveal toggle beside it, which only makes sense if the server sends secrets
 * back. This form takes a value, states that it is shown once and never again,
 * and never renders an existing key.
 */
function AddKeyDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [providerId, setProviderId] = React.useState<ProviderId>("stripe");
  const [environment, setEnvironment] = React.useState<Environment>("Production");
  const [notice, setNotice] = React.useState(false);
  const provider = providerById(providerId)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Sheet side="right" className="w-full max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNotice(true);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
            <h2 className="font-heading text-xl font-semibold text-ink">New API key</h2>
            <Button variant="ghost" size="icon-sm" aria-label="Close" render={<DialogClose />}>
              ✕
            </Button>
          </div>

          <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
            <fieldset>
              <legend className="mb-3 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                Provider
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {providers.map((p) => {
                  const selected = p.id === providerId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setProviderId(p.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-3",
                        "transition-colors duration-(--duration-fast)",
                        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                        selected
                          ? "border-brand bg-brand-subtle text-brand"
                          : "border-line bg-surface-sunken text-ink-tertiary hover:border-line-strong hover:text-ink"
                      )}
                    >
                      <KeyRound className="size-4" aria-hidden />
                      <span className="text-[0.6875rem] font-semibold">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="key-label"
                className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
              >
                Label
              </label>
              <Input
                id="key-label"
                required
                placeholder="e.g. Client portal gateway"
                autoComplete="off"
              />
            </div>

            <fieldset>
              <legend className="mb-3 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                Environment
              </legend>
              <div className="flex flex-wrap gap-2">
                {environments.map((env) => {
                  const selected = env === environment;
                  return (
                    <label
                      key={env}
                      className={cn(
                        "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3",
                        "transition-colors duration-(--duration-fast)",
                        "focus-within:ring-2 focus-within:ring-brand/50",
                        selected
                          ? "border-brand bg-brand-subtle"
                          : "border-line bg-surface-sunken hover:border-line-strong"
                      )}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value={env}
                        checked={selected}
                        onChange={() => setEnvironment(env)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "size-2.5 rounded-full",
                          selected ? "bg-brand" : "bg-ink-tertiary"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[0.8125rem] font-semibold",
                          selected ? "text-brand" : "text-ink-secondary"
                        )}
                      >
                        {env}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="key-value"
                className="text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
              >
                Key value
              </label>
              <Input
                id="key-value"
                type="password"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder={`${provider.keyPrefix}…`}
                className="font-mono"
              />
              <p className="text-[0.75rem] leading-relaxed text-ink-tertiary">
                Paste the key from {provider.name}. Give it the narrowest scope the
                integration needs. It is stored hashed — after saving, only the last
                four characters are ever shown again.
              </p>
            </div>

            {notice && (
              <Alert tone="warning">
                <AlertTitle>Not saved</AlertTitle>
                <AlertDescription>
                  {/* TODO: POST to the integrations endpoint, which must hash the
                      value server-side and return only `last4`. */}
                  The integrations API is not connected yet, so nothing was stored
                  and no key was transmitted.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-line p-6">
            <Button type="submit" size="lg" className="w-full">
              Register integration
            </Button>
            <Button variant="ghost" className="w-full" render={<DialogClose />}>
              Cancel
            </Button>
          </div>
        </form>
      </Sheet>
    </Dialog>
  );
}
