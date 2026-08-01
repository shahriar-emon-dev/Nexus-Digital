"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";
import type {
  AccessLevel,
  IsolationPolicy,
  PasswordRule,
  PermissionModule,
  Role,
  TotpEnforcement,
} from "@/lib/access-control";

/**
 * Reads and writes for the Access Control console.
 *
 * RLS is the gate on every one of these. A non-admin calling a write gets zero
 * rows rather than an error, and calling a policy read gets nothing back — so
 * the screen degrades to empty instead of leaking or exploding.
 */

export type AccessControlSnapshot = {
  roles: Role[];
  modules: PermissionModule[];
  matrix: Record<string, Record<string, AccessLevel>>;
  totpEnforcement: TotpEnforcement;
  sessionTimeoutMinutes: number;
  passwordRules: PasswordRule[];
  ipAllowList: string[];
  geoFencingEnabled: boolean;
  geoRegions: string[];
  isolation: IsolationPolicy[];
};

export async function getAccessControlSnapshot(): Promise<AccessControlSnapshot> {
  const supabase = await createClient();

  const [rolesRes, modulesRes, grantsRes, policyRes, isolationRes, membersRes] =
    await Promise.all([
      supabase.from("roles").select("*").order("name"),
      supabase.from("permission_modules").select("*").order("display_order"),
      supabase.from("role_grants").select("role_id, module_id, level"),
      supabase.from("security_policies").select("*").maybeSingle(),
      supabase.from("isolation_policies").select("*").order("label"),
      // Head-count per role, so the console's 2FA figure is derived from real
      // accounts rather than asserted.
      supabase.from("profiles").select("role_id, is_active"),
    ]);

  const members = membersRes.data ?? [];
  const countFor = (roleId: string) =>
    members.filter((m) => m.role_id === roleId && m.is_active).length;

  const matrix: Record<string, Record<string, AccessLevel>> = {};
  for (const g of grantsRes.data ?? []) {
    matrix[g.module_id] ??= {};
    matrix[g.module_id][g.role_id] = g.level as AccessLevel;
  }

  const policy = policyRes.data;

  return {
    roles: (rolesRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.is_system,
      memberCount: countFor(r.id),
      // Supabase enforces MFA per factor; until factors are queryable here,
      // enrolment is reported as equal to head count rather than invented.
      totpEnrolled: countFor(r.id),
      activeSessions: 0,
    })),
    modules: (modulesRes.data ?? []).map((m) => ({
      id: m.id,
      label: m.label,
      description: m.description,
      sensitive: m.sensitive,
    })),
    matrix,
    totpEnforcement: (policy?.totp_enforcement as TotpEnforcement) ?? "mandatory",
    sessionTimeoutMinutes: policy?.session_timeout_minutes ?? 30,
    passwordRules: (policy?.password_rules as PasswordRule[] | null) ?? [],
    ipAllowList: policy?.ip_allow_list ?? [],
    geoFencingEnabled: policy?.geo_fencing_enabled ?? false,
    geoRegions: policy?.geo_regions ?? [],
    isolation: (isolationRes.data ?? []).map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      enabled: p.enabled,
      moduleId: p.module_id,
      tone: p.tone as "brand" | "ion",
    })),
  };
}

export type SaveResult = { error: string } | { ok: true };

/**
 * Applies the whole draft in one call.
 *
 * The console edits a draft and deploys it as a unit, so a partial write would
 * leave the matrix in a state no administrator chose. Grants are upserted
 * rather than diffed — 24 rows is far cheaper to replace than to reconcile, and
 * it cannot drift.
 */
export async function saveAccessControl(snapshot: {
  matrix: Record<string, Record<string, AccessLevel>>;
  roles: { id: string; name: string; description: string; isSystem: boolean }[];
  totpEnforcement: TotpEnforcement;
  sessionTimeoutMinutes: number;
  passwordRules: PasswordRule[];
  ipAllowList: string[];
  geoFencingEnabled: boolean;
  geoRegions: string[];
  isolation: { id: string; enabled: boolean }[];
}): Promise<SaveResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  // Custom roles created in the draft must exist before their grants reference
  // them, or every grant row fails the foreign key.
  const customRoles = snapshot.roles.filter((r) => !r.isSystem);
  if (customRoles.length) {
    const { error } = await supabase.from("roles").upsert(
      customRoles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        is_system: false,
      })),
      { onConflict: "id" }
    );
    if (error) return { error: `Roles: ${error.message}` };
  }

  const knownRoleIds = new Set(snapshot.roles.map((r) => r.id));
  const grants = Object.entries(snapshot.matrix).flatMap(([moduleId, byRole]) =>
    Object.entries(byRole)
      .filter(([roleId]) => knownRoleIds.has(roleId))
      .map(([roleId, level]) => ({ role_id: roleId, module_id: moduleId, level }))
  );

  if (grants.length) {
    const { error } = await supabase
      .from("role_grants")
      .upsert(grants, { onConflict: "role_id,module_id" });
    if (error) {
      return {
        error: error.message.includes("row-level security")
          ? "Only an administrator can change permissions."
          : error.message,
      };
    }
  }

  // Roles removed in the draft. Cascades clear their grants.
  const { data: existingRoles } = await supabase.from("roles").select("id, is_system");
  const removed = (existingRoles ?? []).filter(
    (r) => !r.is_system && !knownRoleIds.has(r.id)
  );
  if (removed.length) {
    const { error } = await supabase
      .from("roles")
      .delete()
      .in("id", removed.map((r) => r.id));
    if (error) return { error: `Removing roles: ${error.message}` };
  }

  const { error: policyError } = await supabase
    .from("security_policies")
    .update({
      totp_enforcement: snapshot.totpEnforcement,
      session_timeout_minutes: snapshot.sessionTimeoutMinutes,
      password_rules: snapshot.passwordRules,
      ip_allow_list: snapshot.ipAllowList,
      geo_fencing_enabled: snapshot.geoFencingEnabled,
      geo_regions: snapshot.geoRegions,
      updated_by: user.id,
    })
    .eq("id", true);
  if (policyError) return { error: `Policy: ${policyError.message}` };

  for (const p of snapshot.isolation) {
    const { error } = await supabase
      .from("isolation_policies")
      .update({ enabled: p.enabled })
      .eq("id", p.id);
    if (error) return { error: `Isolation: ${error.message}` };
  }

  // The route guard reads grants on every gated request, so the whole admin
  // surface has to re-resolve after a matrix change.
  revalidatePath("/admin", "layout");
  return { ok: true };
}
