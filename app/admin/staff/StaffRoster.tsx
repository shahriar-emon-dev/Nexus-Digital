"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  addToRoster,
  removeFromRoster,
  setStaffPublic,
  updateStaff,
  type StaffMember,
} from "@/lib/supabase/staff-actions";
import { cn } from "@/lib/utils";

const DEPARTMENTS = [
  "Core Engineering",
  "Design Systems",
  "Growth",
  "Strategy",
  "Operations",
] as const;

/** Utilisation bands, matching the heatmap legend. */
function utilisationTone(pct: number | null, assigned: number) {
  if (assigned === 0) return { tone: "default" as const, label: "Not scheduled" };
  if (pct === null) return { tone: "default" as const, label: "No capacity set" };
  if (pct > 100) return { tone: "danger" as const, label: "Overbooked" };
  if (pct >= 60) return { tone: "success" as const, label: "Optimised" };
  return { tone: "info" as const, label: "Underutilised" };
}

export function StaffRoster({
  initial,
  unrostered,
  departments,
}: {
  initial: StaffMember[];
  unrostered: { id: string; full_name: string; email: string }[];
  departments: string[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [staff, setStaff] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [department, setDepartment] = React.useState<string>("all");
  const [visibility, setVisibility] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<StaffMember | null>(null);
  const [removing, setRemoving] = React.useState<StaffMember | null>(null);

  React.useEffect(() => setStaff(initial), [initial]);

  useRealtime(
    "admin:staff",
    [{ table: "staff_profiles" }, { table: "project_assignments" }],
    () => router.refresh()
  );

  const summary = React.useMemo(() => {
    const withCapacity = staff.filter((s) => s.utilisation.capacityHours > 0);
    const capacity = withCapacity.reduce((n, s) => n + s.utilisation.capacityHours, 0);
    const assigned = withCapacity.reduce((n, s) => n + s.utilisation.assignedHours, 0);
    return {
      headcount: staff.length,
      published: staff.filter((s) => s.is_public).length,
      // Null rather than 0 when nothing is recorded: 0% would read as "nobody
      // is working" when the truth is "nothing has been scheduled here yet".
      utilisation: capacity > 0 ? Math.round((assigned / capacity) * 100) : null,
      overbooked: staff.filter((s) => (s.utilisation.pct ?? 0) > 100).length,
    };
  }, [staff]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((s) => {
      if (department !== "all" && s.department !== department) return false;
      if (visibility === "public" && !s.is_public) return false;
      if (visibility === "internal" && s.is_public) return false;
      if (!q) return true;
      return (
        (s.profiles?.full_name ?? "").toLowerCase().includes(q) ||
        (s.profiles?.email ?? "").toLowerCase().includes(q) ||
        s.display_role.toLowerCase().includes(q) ||
        s.skills.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [staff, query, department, visibility]);

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
        <StatCard label="On the roster" value={String(summary.headcount)} icon={Users} />
        <StatCard
          label="Published"
          value={String(summary.published)}
          caption="Visible on the About page"
        />
        <StatCard
          label="Utilisation"
          value={summary.utilisation === null ? "—" : `${summary.utilisation}%`}
          caption={
            summary.utilisation === null
              ? "No hours assigned yet"
              : "Assigned hours over contracted hours"
          }
        />
        <StatCard
          label="Overbooked"
          value={String(summary.overbooked)}
          caption={summary.overbooked === 0 ? "Nobody over capacity" : "Above contracted hours"}
        />
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
            placeholder="Search name, role or skill…"
            aria-label="Search the roster"
            className="pl-9"
          />
        </div>

        <Select value={department} onValueChange={(v) => setDepartment(v as string)}>
          <SelectTrigger className="w-48" aria-label="Filter by department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visibility} onValueChange={(v) => setVisibility(v as string)}>
          <SelectTrigger className="w-40" aria-label="Filter by visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="public">Published</SelectItem>
            <SelectItem value="internal">Internal only</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setAdding(true)} disabled={unrostered.length === 0}>
          <UserPlus />
          Add to roster
        </Button>
      </div>

      {unrostered.length === 0 && staff.length > 0 && (
        <p className="text-xs text-ink-tertiary">
          Every active staff and admin account is already on the roster. New
          people appear here once their account is created in Settings → Users.
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={staff.length === 0 ? "Nobody on the roster yet" : "No matches"}
          description={
            staff.length === 0
              ? "The roster carries the public presentation and the capacity figures. Adding someone here does not publish them — that is a separate, deliberate step."
              : "No one matches that search and filter."
          }
          action={
            staff.length === 0 && unrostered.length > 0 ? (
              <Button size="sm" onClick={() => setAdding(true)}>
                <UserPlus />
                Add to roster
              </Button>
            ) : staff.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setDepartment("all");
                  setVisibility("all");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => {
            const util = utilisationTone(s.utilisation.pct, s.utilisation.assignedHours);
            const name = s.profiles?.full_name || s.profiles?.email || "Unknown";
            return (
              <li key={s.id}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-11">
                        {s.profiles?.avatar_url && <AvatarImage src={s.profiles.avatar_url} alt="" />}
                        <AvatarFallback>{initials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{name}</p>
                        <p className="truncate text-sm text-ink-tertiary">{s.display_role}</p>
                        {s.profiles && !s.profiles.is_active && (
                          <Badge variant="warning" size="sm" className="mt-1">
                            Account deactivated
                          </Badge>
                        )}
                      </div>
                      <Badge variant={s.is_public ? "success" : "outline"} size="sm">
                        {s.is_public ? "Published" : "Internal"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {s.department && (
                        <Badge variant="brand" size="sm">
                          {s.department}
                        </Badge>
                      )}
                      {s.seniority && (
                        <Badge variant="outline" size="sm">
                          {s.seniority}
                        </Badge>
                      )}
                      {!s.is_billable && (
                        <Badge variant="default" size="sm">
                          Non-billable
                        </Badge>
                      )}
                    </div>

                    {s.skills.length > 0 && (
                      <p className="text-xs text-ink-tertiary">{s.skills.join(" · ")}</p>
                    )}

                    <div className="mt-auto flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-tertiary">
                          {s.utilisation.assignedHours}h of {s.utilisation.capacityHours}h ·{" "}
                          {s.utilisation.projectCount}{" "}
                          {s.utilisation.projectCount === 1 ? "project" : "projects"}
                        </span>
                        <Badge variant={util.tone} size="sm">
                          {s.utilisation.pct === null ? util.label : `${s.utilisation.pct}%`}
                        </Badge>
                      </div>
                      <Progress
                        value={Math.min(100, s.utilisation.pct ?? 0)}
                        className={cn("h-1.5", (s.utilisation.pct ?? 0) > 100 && "[&>*]:bg-danger")}
                      />
                    </div>

                    <div className="flex justify-end gap-1 border-t border-line-subtle pt-3">
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => setStaffPublic(s.id, !s.is_public),
                            s.is_public ? "Removed from the About page" : "Published to the About page"
                          )
                        }
                      >
                        {s.is_public ? <EyeOff /> : <Eye />}
                        {s.is_public ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setEditing(s)} aria-label={`Edit ${name}`}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-danger"
                        onClick={() => setRemoving(s)}
                        aria-label={`Remove ${name} from the roster`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* ------------------------------------------------------------ add -- */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              if (await run(() => addToRoster(form), "Added to the roster")) setAdding(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Add someone to the roster</DialogTitle>
              <DialogDescription>
                Only accounts that already exist can be added — the roster
                describes people, it does not create logins. They stay internal
                until you publish them.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-profile">Account</Label>
                <select
                  id="s-profile"
                  name="profileId"
                  required
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  <option value="">Choose an account…</option>
                  {unrostered.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-role">Display role</Label>
                  <Input id="s-role" name="displayRole" placeholder="Principal Engineer" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-dept">Department</Label>
                  <select
                    id="s-dept"
                    name="department"
                    className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                  >
                    <option value="">Unassigned</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-seniority">Seniority</Label>
                  <Input id="s-seniority" name="seniority" placeholder="Principal, L5…" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-capacity">Weekly hours</Label>
                  <Input
                    id="s-capacity"
                    name="capacityHours"
                    type="number"
                    min="0"
                    max="168"
                    step="0.5"
                    defaultValue={40}
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Plus />}
                Add to roster
              </Button>
            </DialogFooter>
          </form>
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
                if (await run(() => updateStaff(editing.id, form), "Roster entry saved")) {
                  setEditing(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{editing.profiles?.full_name || editing.slug}</DialogTitle>
                <DialogDescription>
                  Name, email and avatar come from the account itself and are
                  edited there — one person, one place.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="e-role">Display role</Label>
                    <Input id="e-role" name="displayRole" defaultValue={editing.display_role} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="e-dept">Department</Label>
                    <select
                      id="e-dept"
                      name="department"
                      defaultValue={editing.department ?? ""}
                      className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                    >
                      <option value="">Unassigned</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="e-seniority">Seniority</Label>
                    <Input id="e-seniority" name="seniority" defaultValue={editing.seniority ?? ""} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="e-capacity">Weekly hours</Label>
                    <Input
                      id="e-capacity"
                      name="capacityHours"
                      type="number"
                      min="0"
                      max="168"
                      step="0.5"
                      defaultValue={editing.weekly_capacity_hours}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="e-skills">Skills</Label>
                  <Input
                    id="e-skills"
                    name="skills"
                    defaultValue={editing.skills.join(", ")}
                    placeholder="TypeScript, Postgres, Design systems"
                  />
                  <p className="text-xs text-ink-tertiary">Comma separated.</p>
                </div>

                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="isBillable"
                    defaultChecked={editing.is_billable}
                    className="size-4 rounded border-line-strong"
                  />
                  Billable — counts toward the direct/overhead ratio
                </label>
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

      {/* --------------------------------------------------------- remove -- */}
      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          {removing && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Remove {removing.profiles?.full_name || removing.slug} from the roster?
                </DialogTitle>
                <DialogDescription>
                  Their account, sign-in and project history are untouched. This
                  removes the public presentation and the capacity figure, so
                  they drop out of the About page and the allocation view.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => removeFromRoster(removing.id), "Removed from the roster")) {
                      setRemoving(null);
                    }
                  }}
                >
                  <Trash2 />
                  Remove
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
