"use client";

import * as React from "react";
import {
  Activity,
  Check,
  Globe2,
  KeyRound,
  Lock,
  Network,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  accessLevelRank,
  accessLevels,
  authPolicy,
  geoRegionOptions,
  isolationPolicies,
  isValidIpRule,
  networkPolicy,
  permissionModules,
  roleMatrix,
  roles,
  sessionTimeoutOptions,
  type AccessLevel,
  type Role,
  type TotpEnforcement,
} from "@/lib/access-control";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------- helpers --- */

type Matrix = Record<string, Record<string, AccessLevel>>;

const levelTone: Record<AccessLevel, string> = {
  none: "border-line bg-surface-sunken text-ink-tertiary",
  audit: "border-info-line bg-info-subtle text-info",
  view: "border-line-strong bg-surface-sunken text-ink-secondary",
  edit: "border-line-strong bg-surface-sunken text-ink-secondary",
  admin: "border-ion-subtle bg-ion-subtle text-ion-subtle-fg",
  full: "border-brand-line bg-brand-subtle text-brand-subtle-fg",
};

const shortLabel = (l: AccessLevel) =>
  accessLevels.find((a) => a.value === l)?.short ?? l;

const threatTone = {
  LOW: { badge: "success", icon: ShieldCheck, text: "text-success" },
  ELEVATED: { badge: "warning", icon: ShieldAlert, text: "text-warning" },
  HIGH: { badge: "danger", icon: ShieldAlert, text: "text-danger" },
} as const;

/** Deep clone so the module-level defaults are never mutated by the editor. */
const cloneMatrix = (m: Matrix): Matrix =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ...v }]));

/* ---------------------------------------------------------------- page ---- */

export function AccessControlConsole() {
  const toast = useToast();

  /* ---- draft state: everything edits a draft, nothing applies until Save -- */
  const [matrix, setMatrix] = React.useState<Matrix>(() => cloneMatrix(roleMatrix));
  const [roleList, setRoleList] = React.useState<Role[]>(roles);
  const [totp, setTotp] = React.useState<TotpEnforcement>(authPolicy.totpEnforcement);
  const [timeout_, setTimeout_] = React.useState<number>(authPolicy.sessionTimeoutMinutes);
  const [passwordRules, setPasswordRules] = React.useState(authPolicy.passwordRules);
  const [isolation, setIsolation] = React.useState(isolationPolicies);
  const [ipRanges, setIpRanges] = React.useState(networkPolicy.ipRanges);
  const [geoEnabled, setGeoEnabled] = React.useState(networkPolicy.geoFencing.enabled);
  const [geoRegions, setGeoRegions] = React.useState(networkPolicy.geoFencing.regions);

  /** The last committed snapshot — what "Discard" restores and what dirty compares against. */
  const [saved, setSaved] = React.useState(() =>
    JSON.stringify({
      matrix: roleMatrix,
      roles,
      totp: authPolicy.totpEnforcement,
      timeout: authPolicy.sessionTimeoutMinutes,
      passwordRules: authPolicy.passwordRules,
      isolation: isolationPolicies,
      ipRanges: networkPolicy.ipRanges,
      geoEnabled: networkPolicy.geoFencing.enabled,
      geoRegions: networkPolicy.geoFencing.regions,
    })
  );

  const current = React.useMemo(
    () =>
      JSON.stringify({
        matrix,
        roles: roleList,
        totp,
        timeout: timeout_,
        passwordRules,
        isolation,
        ipRanges,
        geoEnabled,
        geoRegions,
      }),
    [matrix, roleList, totp, timeout_, passwordRules, isolation, ipRanges, geoEnabled, geoRegions]
  );

  const dirty = current !== saved;

  /* ---- posture recomputes from the DRAFT, so the header reacts live ------ */
  const posture = React.useMemo(() => {
    const members = roleList.reduce((n, r) => n + r.memberCount, 0);
    const enrolled = roleList.reduce((n, r) => n + r.totpEnrolled, 0);

    const gaps: string[] = [];
    if (enrolled < members) gaps.push("incomplete 2FA enrolment");
    if (totp !== "mandatory") gaps.push("TOTP is optional");
    if (ipRanges.length === 0) gaps.push("no IP allow-list");
    const auditorSec = matrix["security-policies"]?.["financial-auditor"] ?? "none";
    if (accessLevelRank[auditorSec] > accessLevelRank.audit)
      gaps.push("auditor can write security policy");

    const level = gaps.length === 0 ? "LOW" : gaps.length === 1 ? "ELEVATED" : "HIGH";
    return {
      members,
      enrolled,
      rate: members ? Math.round((enrolled / members) * 100) : 0,
      sessions: roleList.reduce((n, r) => n + r.activeSessions, 0),
      level: level as keyof typeof threatTone,
      reason:
        gaps.length === 0
          ? "All baseline controls are enforced."
          : `${gaps.length} gap${gaps.length > 1 ? "s" : ""}: ${gaps.join(", ")}.`,
    };
  }, [roleList, totp, ipRanges, matrix]);

  const elevated = React.useMemo(
    () =>
      permissionModules.reduce(
        (n, m) =>
          n +
          roleList.filter(
            (r) => accessLevelRank[matrix[m.id]?.[r.id] ?? "none"] >= accessLevelRank.admin
          ).length,
        0
      ),
    [matrix, roleList]
  );

  /* ---- actions ----------------------------------------------------------- */

  function setGrant(moduleId: string, roleId: string, level: AccessLevel) {
    setMatrix((m) => ({ ...m, [moduleId]: { ...m[moduleId], [roleId]: level } }));
  }

  function addRole(name: string, description: string) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setRoleList((rs) => [
      ...rs,
      { id, name, description, isSystem: false, memberCount: 0, totpEnrolled: 0, activeSessions: 0 },
    ]);
    // A new role starts with no access anywhere. Deny by default is the only
    // safe starting point for a permission row.
    setMatrix((m) =>
      Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ...v, [id]: "none" as AccessLevel }]))
    );
    toast.add({
      title: `Role “${name}” drafted`,
      description: "It starts with no access on every module. Grant what it needs, then save.",
      type: "success",
    });
  }

  function removeRole(role: Role) {
    setRoleList((rs) => rs.filter((r) => r.id !== role.id));
    setMatrix((m) =>
      Object.fromEntries(
        Object.entries(m).map(([k, v]) => {
          const { [role.id]: _drop, ...rest } = v;
          return [k, rest];
        })
      )
    );
    toast.add({ title: `Role “${role.name}” removed from the draft`, type: "info" });
  }

  function save() {
    setSaved(current);
    toast.add({
      title: "Security policy deployed",
      description: `${permissionModules.length} modules · ${roleList.length} roles · ${ipRanges.length} network rules.`,
      type: "success",
    });
  }

  function discard() {
    setMatrix(cloneMatrix(roleMatrix));
    setRoleList(roles);
    setTotp(authPolicy.totpEnforcement);
    setTimeout_(authPolicy.sessionTimeoutMinutes);
    setPasswordRules(authPolicy.passwordRules);
    setIsolation(isolationPolicies);
    setIpRanges(networkPolicy.ipRanges);
    setGeoEnabled(networkPolicy.geoFencing.enabled);
    setGeoRegions(networkPolicy.geoFencing.regions);
    setSaved(
      JSON.stringify({
        matrix: roleMatrix,
        roles,
        totp: authPolicy.totpEnforcement,
        timeout: authPolicy.sessionTimeoutMinutes,
        passwordRules: authPolicy.passwordRules,
        isolation: isolationPolicies,
        ipRanges: networkPolicy.ipRanges,
        geoEnabled: networkPolicy.geoFencing.enabled,
        geoRegions: networkPolicy.geoFencing.regions,
      })
    );
    toast.add({ title: "Draft discarded", description: "Restored to the deployed policy.", type: "info" });
  }

  const ThreatIcon = threatTone[posture.level].icon;

  return (
    <div className="flex flex-col gap-8">
      {/* ------------------------------------------------ posture header --- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PostureCard
          icon={ShieldCheck}
          eyebrow="Global policy"
          value={`${posture.rate}%`}
          label="2FA enforcement rate"
          caption={`${posture.enrolled} of ${posture.members} accounts enrolled`}
        />
        <PostureCard
          icon={Users}
          eyebrow="Active state"
          value={posture.sessions.toLocaleString()}
          label="Current active sessions"
          caption={`Across ${roleList.length} roles · ${elevated} elevated grants`}
        />
        <PostureCard
          icon={ThreatIcon}
          eyebrow="Threat intelligence"
          value={posture.level}
          label="Real-time threat level"
          caption={posture.reason}
          valueClassName={threatTone[posture.level].text}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* --------------------------------------------- role matrix ------ */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle">
              <div>
                <CardTitle>Granular role matrix</CardTitle>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {elevated} grant{elevated === 1 ? "" : "s"} at administrator or above.
                  Every change is written to the audit trail on save.
                </p>
              </div>
              <AddRoleDialog existing={roleList} onAdd={addRole} />
            </CardHeader>

            {/* min-w-0 lets the scroller shrink inside the grid column. */}
            <CardContent className="min-w-0 p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[46rem] border-collapse text-left">
                  <caption className="sr-only">
                    Access level granted to each role for each permission module.
                    Each cell is a menu that changes the grant.
                  </caption>
                  <thead>
                    <tr className="border-b border-line-subtle bg-surface-sunken/60">
                      <th
                        scope="col"
                        className="px-5 py-3 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-tertiary uppercase"
                      >
                        Module / resource
                      </th>
                      {roleList.map((r) => (
                        <th
                          key={r.id}
                          scope="col"
                          className="px-3 py-3 text-center text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-tertiary uppercase"
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            {r.name}
                            {!r.isSystem && (
                              <button
                                type="button"
                                onClick={() => removeRole(r)}
                                className="rounded p-0.5 text-ink-tertiary transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                              >
                                <Trash2 className="size-3" aria-hidden />
                                <span className="sr-only">Delete the {r.name} role</span>
                              </button>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[0.625rem] font-normal normal-case tracking-normal text-ink-tertiary/70">
                            {r.memberCount} member{r.memberCount === 1 ? "" : "s"}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {permissionModules.map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-surface-sunken/40">
                        <th scope="row" className="px-5 py-3 text-left align-middle">
                          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                            {m.label}
                            {m.sensitive && (
                              <Lock className="size-3 text-ink-tertiary" aria-label="Holds regulated data" />
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs font-normal text-ink-tertiary">
                            {m.description}
                          </span>
                        </th>
                        {roleList.map((r) => {
                          const level = matrix[m.id]?.[r.id] ?? "none";
                          return (
                            <td key={r.id} className="px-3 py-3 text-center align-middle">
                              <Select
                                value={level}
                                onValueChange={(v) => setGrant(m.id, r.id, v as AccessLevel)}
                              >
                                <SelectTrigger
                                  size="sm"
                                  aria-label={`${m.label} access for ${r.name}`}
                                  className={cn(
                                    "mx-auto w-[7.5rem] justify-center border font-medium",
                                    levelTone[level]
                                  )}
                                >
                                  <SelectValue>{shortLabel(level)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {accessLevels.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>
                                      {a.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ------------------------------------ isolation policy bento --- */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isolation.map((p) => (
              <Card
                key={p.id}
                className={cn(
                  "border-l-4 transition-colors",
                  p.enabled
                    ? p.tone === "brand"
                      ? "border-l-brand"
                      : "border-l-ion"
                    : "border-l-line-strong"
                )}
              >
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border",
                        p.enabled
                          ? p.tone === "brand"
                            ? "border-brand-line bg-brand-subtle text-brand-subtle-fg"
                            : "border-transparent bg-ion-subtle text-ion-subtle-fg"
                          : "border-line bg-surface-sunken text-ink-tertiary"
                      )}
                    >
                      <Lock className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-heading text-sm font-semibold text-ink">{p.label}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-tertiary">
                        {p.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={p.enabled}
                    onCheckedChange={(v) =>
                      setIsolation((ps) =>
                        ps.map((x) => (x.id === p.id ? { ...x, enabled: v } : x))
                      )
                    }
                    aria-label={p.label}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ------------------------------------------- auth + network ------ */}
        <aside className="flex flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2.5">
              <KeyRound className="size-4 text-brand" aria-hidden />
              <CardTitle>Auth protocol</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-7">
              <fieldset>
                <legend className="mb-2.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
                  Global TOTP enforcement
                </legend>
                <div className="flex gap-1 rounded-lg border border-line bg-surface-sunken p-1">
                  {(["mandatory", "optional"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTotp(v)}
                      aria-pressed={totp === v}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                        totp === v
                          ? "bg-brand text-brand-fg shadow-e1"
                          : "text-ink-tertiary hover:text-ink"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {totp === "optional" && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                    <ShieldAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                    Optional TOTP raises the threat level. Existing enrolments are kept.
                  </p>
                )}
              </fieldset>

              <fieldset>
                <legend className="mb-2.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
                  Session timeout duration
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {sessionTimeoutOptions.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeout_(mins)}
                      aria-pressed={timeout_ === mins}
                      className={cn(
                        "rounded-lg border py-2 text-xs font-medium transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                        timeout_ === mins
                          ? "border-brand bg-brand-subtle font-semibold text-brand-subtle-fg"
                          : "border-line text-ink-secondary hover:border-brand-line"
                      )}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
                  Password complexity
                </legend>
                <ul className="flex flex-col gap-2.5">
                  {passwordRules.map((rule) => (
                    <li key={rule.id} className="flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "text-sm",
                          rule.enabled ? "text-ink-secondary" : "text-ink-tertiary"
                        )}
                      >
                        {rule.label}
                        {rule.locked && (
                          <Badge variant="outline" size="sm" className="ml-2 align-middle">
                            Required
                          </Badge>
                        )}
                      </span>
                      <Switch
                        checked={rule.enabled}
                        disabled={rule.locked}
                        onCheckedChange={(v) =>
                          setPasswordRules((rs) =>
                            rs.map((x) => (x.id === rule.id ? { ...x, enabled: v } : x))
                          )
                        }
                        aria-label={rule.label}
                      />
                    </li>
                  ))}
                </ul>
              </fieldset>
            </CardContent>
          </Card>

          <NetworkAccessCard
            ipRanges={ipRanges}
            setIpRanges={setIpRanges}
            geoEnabled={geoEnabled}
            setGeoEnabled={setGeoEnabled}
            geoRegions={geoRegions}
            setGeoRegions={setGeoRegions}
          />
        </aside>
      </div>

      {/* ------------------------------------------------- save bar ------- */}
      {dirty && (
        <div
          role="status"
          className={cn(
            "sticky bottom-4 z-30 mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-3",
            "rounded-xl border border-brand-line bg-surface-raised/95 px-4 py-3 shadow-e4 backdrop-blur",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
          )}
        >
          <p className="flex items-center gap-2 text-sm text-ink">
            <Activity className="size-4 text-brand" aria-hidden />
            Policy draft has unsaved changes.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={discard}>
              <RotateCcw />
              Discard
            </Button>
            <Button size="sm" onClick={save}>
              <Check />
              Deploy policy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------ posture card ----- */

function PostureCard({
  icon: Icon,
  eyebrow,
  value,
  label,
  caption,
  valueClassName,
  highlight,
}: {
  icon: React.ElementType;
  eyebrow: string;
  value: string;
  label: string;
  caption: string;
  valueClassName?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("transition-colors hover:border-brand-line/60", highlight && "bg-surface-sunken/40")}>
      <CardContent className="flex h-full flex-col justify-between gap-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <Icon className="size-6 text-brand" aria-hidden />
          <span className="text-[0.625rem] font-semibold tracking-[0.1em] text-ink-tertiary uppercase">
            {eyebrow}
          </span>
        </div>
        <div>
          <div
            className={cn(
              "font-heading text-[2.25rem] leading-none font-bold tracking-tight text-ink",
              valueClassName
            )}
          >
            {value}
          </div>
          <div className="mt-1.5 text-sm font-medium text-ink-secondary">{label}</div>
          <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------- add role -------- */

function AddRoleDialog({
  existing,
  onAdd,
}: {
  existing: Role[];
  onAdd: (name: string, description: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const duplicate = existing.some((r) => r.name.toLowerCase() === name.trim().toLowerCase());
  const valid = name.trim().length >= 3 && !duplicate;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onAdd(name.trim(), description.trim() || "Custom role — no description yet.");
    setName("");
    setDescription("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Add custom role
      </Button>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add a custom role</DialogTitle>
            <DialogDescription>
              The role is created with no access to any module. Grant permissions in
              the matrix, then deploy.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role-name" className="text-sm font-medium text-ink">
                Role name
              </label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Compliance Reviewer"
                autoFocus
                aria-invalid={duplicate || undefined}
                aria-describedby="role-name-help"
              />
              <p
                id="role-name-help"
                className={cn("text-xs", duplicate ? "text-danger" : "text-ink-tertiary")}
              >
                {duplicate
                  ? "A role with that name already exists."
                  : "At least 3 characters. Shown as a column in the matrix."}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role-desc" className="text-sm font-medium text-ink">
                Description <span className="text-ink-tertiary">(optional)</span>
              </label>
              <Textarea
                id="role-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this role is accountable for."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!valid}>
              <Plus />
              Create role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------ network card ----- */

function NetworkAccessCard({
  ipRanges,
  setIpRanges,
  geoEnabled,
  setGeoEnabled,
  geoRegions,
  setGeoRegions,
}: {
  ipRanges: string[];
  setIpRanges: React.Dispatch<React.SetStateAction<string[]>>;
  geoEnabled: boolean;
  setGeoEnabled: (v: boolean) => void;
  geoRegions: string[];
  setGeoRegions: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(ipRanges.join("\n"));

  const lines = draft.split("\n").map((l) => l.trim()).filter(Boolean);
  const invalid = lines.filter((l) => !isValidIpRule(l));
  const canSave = lines.length > 0 && invalid.length === 0;

  function openEditor() {
    setDraft(ipRanges.join("\n"));
    setEditing(true);
  }

  function commit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setIpRanges(lines);
    setEditing(false);
  }

  const unusedRegions = geoRegionOptions.filter((r) => !geoRegions.includes(r));

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2.5">
        <Network className="size-4 text-brand" aria-hidden />
        <CardTitle>Network access</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-line bg-surface-sunken p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
              Whitelisted IP ranges
            </span>
            <Button variant="ghost" size="xs" onClick={openEditor}>
              <Pencil />
              Edit
              <span className="sr-only"> whitelisted IP ranges</span>
            </Button>
          </div>
          {ipRanges.length === 0 ? (
            <p className="text-xs text-warning">
              No ranges configured — every source address can reach the admin surface.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 font-mono text-[0.8125rem] text-brand">
              {ipRanges.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface-sunken p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
              Geo-fencing
            </span>
            <Switch
              checked={geoEnabled}
              onCheckedChange={setGeoEnabled}
              aria-label="Geo-fencing"
            />
          </div>

          {!geoEnabled ? (
            <p className="text-xs text-ink-tertiary">
              Disabled — sign-in is permitted from any country.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {geoRegions.length === 0 && (
                  <p className="text-xs text-warning">
                    Geo-fencing is on with no regions allowed — nobody can sign in.
                  </p>
                )}
                {geoRegions.map((region) => (
                  <span
                    key={region}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-line bg-brand-subtle py-0.5 pr-1 pl-2 text-[0.6875rem] font-medium text-brand-subtle-fg"
                  >
                    {region}
                    <button
                      type="button"
                      onClick={() => setGeoRegions((rs) => rs.filter((r) => r !== region))}
                      className="rounded-full p-0.5 transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    >
                      <X className="size-2.5" aria-hidden />
                      <span className="sr-only">Remove {region}</span>
                    </button>
                  </span>
                ))}
              </div>

              {unusedRegions.length > 0 && (
                <div className="mt-3">
                  <Select
                    value=""
                    onValueChange={(v) => v && setGeoRegions((rs) => [...rs, v as string])}
                  >
                    <SelectTrigger size="sm" aria-label="Add an allowed region">
                      <SelectValue placeholder="Add a region…" />
                    </SelectTrigger>
                    <SelectContent>
                      {unusedRegions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        <p className="flex items-start gap-1.5 text-xs text-ink-tertiary">
          <Globe2 className="mt-px size-3.5 shrink-0" aria-hidden />
          Network rules apply to the admin and staff surfaces. The public site and the
          client portal are unaffected.
        </p>
      </CardContent>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <form onSubmit={commit}>
            <DialogHeader>
              <DialogTitle>Whitelisted IP ranges</DialogTitle>
              <DialogDescription>
                One rule per line. Accepts a single address, a CIDR block, or an
                inclusive <code className="font-mono">a - b</code> range.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Textarea
                rows={6}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="font-mono text-[0.8125rem]"
                aria-label="IP rules, one per line"
                aria-invalid={invalid.length > 0 || undefined}
                aria-describedby="ip-help"
              />
              <p
                id="ip-help"
                className={cn("mt-2 text-xs", invalid.length ? "text-danger" : "text-ink-tertiary")}
              >
                {invalid.length
                  ? `Unparseable: ${invalid.join(", ")}`
                  : `${lines.length} valid rule${lines.length === 1 ? "" : "s"}.`}
              </p>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
              <Button type="submit" disabled={!canSave}>
                <Check />
                Apply ranges
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
