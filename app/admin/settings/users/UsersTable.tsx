"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, ShieldOff, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  assignPortalAndRole,
  setProfileActive,
  type ProfileWithOrg,
} from "@/lib/supabase/profile-actions";
import type { Portal, Role } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const PORTALS: Portal[] = ["ADMIN", "STAFF", "CLIENT"];

const portalTone: Record<Portal, "brand" | "ion" | "default"> = {
  ADMIN: "brand",
  STAFF: "ion",
  CLIENT: "default",
};

export function UsersTable({
  initialProfiles,
  roles,
  currentUserId,
}: {
  initialProfiles: ProfileWithOrg[];
  roles: Role[];
  currentUserId: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [profiles, setProfiles] = React.useState(initialProfiles);
  const [query, setQuery] = React.useState("");
  const [portalFilter, setPortalFilter] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  /**
   * Realtime across the whole table: another admin changing an assignment
   * shows up here without a reload, and only the affected row is replaced.
   */
  useRealtime("admin:profiles", [{ table: "profiles" }], (payload) => {
    if (payload.eventType === "UPDATE") {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === (payload.new as ProfileWithOrg).id
            ? { ...p, ...(payload.new as ProfileWithOrg) }
            : p
        )
      );
    } else {
      // Insert and delete change the row set, which needs the joins.
      router.refresh();
    }
  });

  React.useEffect(() => setProfiles(initialProfiles), [initialProfiles]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (portalFilter !== "all" && p.portal !== portalFilter) return false;
      if (!q) return true;
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.organizations?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [profiles, query, portalFilter]);

  async function onAssign(user: ProfileWithOrg, portal: Portal, roleId: string | null) {
    setPending(user.id);
    setError(null);
    // Optimistic: the row updates immediately and is reverted if the write fails.
    const previous = profiles;
    setProfiles((prev) =>
      prev.map((p) => (p.id === user.id ? { ...p, portal, role_id: roleId } : p))
    );

    const result = await assignPortalAndRole(user.id, portal, roleId);
    setPending(null);

    if ("error" in result) {
      setProfiles(previous);
      setError(result.error);
      return;
    }
    toast.add({ title: `${user.full_name || user.email} updated`, type: "success" });
  }

  async function onToggleActive(user: ProfileWithOrg) {
    setPending(user.id);
    setError(null);
    const next = !user.is_active;
    const previous = profiles;
    setProfiles((prev) => prev.map((p) => (p.id === user.id ? { ...p, is_active: next } : p)));

    const result = await setProfileActive(user.id, next);
    setPending(null);

    if ("error" in result) {
      setProfiles(previous);
      setError(result.error);
      return;
    }
    toast.add({
      title: next ? "Account reactivated" : "Account deactivated",
      description: next ? undefined : "Their next request will be signed out.",
      type: next ? "success" : "warning",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or organisation…"
            aria-label="Search users"
            className="pl-9"
          />
        </div>

        <Select value={portalFilter} onValueChange={(v) => setPortalFilter(v as string)}>
          <SelectTrigger className="w-44" aria-label="Filter by portal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All portals</SelectItem>
            {PORTALS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-ink-tertiary" aria-live="polite">
          {visible.length} of {profiles.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={profiles.length === 0 ? "No accounts yet" : "No matches"}
          description={
            profiles.length === 0
              ? "Accounts appear here as soon as someone registers."
              : "No account matches that search and filter."
          }
          action={
            profiles.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setPortalFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse text-left">
                <caption className="sr-only">
                  Every account, with the portal and role assigned to it.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Person</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Organisation</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Portal</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Role</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((p) => {
                    const isSelf = p.id === currentUserId;
                    const busy = pending === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "transition-colors hover:bg-surface-sunken/40",
                          busy && "opacity-60",
                          !p.is_active && "opacity-70"
                        )}
                      >
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="flex items-center gap-3">
                            <Avatar className="size-8">
                              {p.avatar_url && <AvatarImage src={p.avatar_url} alt="" />}
                              <AvatarFallback>{initials(p.full_name || p.email)}</AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {p.full_name || "—"}
                                {isSelf && (
                                  <Badge variant="outline" size="sm" className="ml-2 align-middle">
                                    You
                                  </Badge>
                                )}
                              </span>
                              <span className="block truncate text-xs text-ink-tertiary">{p.email}</span>
                            </span>
                          </span>
                        </th>

                        <td className="px-3 py-3 text-sm text-ink-secondary">
                          {p.organizations?.name ?? <span className="text-ink-tertiary">—</span>}
                        </td>

                        <td className="px-3 py-3">
                          {isSelf ? (
                            // Removing your own admin access locks you out of
                            // this very screen, so it is not offered.
                            <Badge variant={portalTone[p.portal]}>{p.portal}</Badge>
                          ) : (
                            <Select
                              value={p.portal}
                              onValueChange={(v) => onAssign(p, v as Portal, p.role_id)}
                            >
                              <SelectTrigger size="sm" className="w-28" aria-label={`Portal for ${p.email}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PORTALS.map((x) => (
                                  <SelectItem key={x} value={x}>{x}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <Select
                            value={p.role_id ?? "none"}
                            onValueChange={(v) =>
                              onAssign(p, p.portal, v === "none" ? null : (v as string))
                            }
                          >
                            <SelectTrigger size="sm" className="w-40" aria-label={`Role for ${p.email}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No role</SelectItem>
                              {roles.map((r) => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-3 py-3 text-right">
                          {isSelf ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="xs"
                              disabled={busy}
                              onClick={() => onToggleActive(p)}
                              className={p.is_active ? "text-success" : "text-danger"}
                            >
                              {p.is_active ? <ShieldCheck /> : <ShieldOff />}
                              {p.is_active ? "Active" : "Disabled"}
                            </Button>
                          )}
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
    </div>
  );
}
