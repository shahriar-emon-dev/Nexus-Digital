import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { AuditEntry } from "./audit-queries";

/**
 * Security posture, read from what the database actually knows.
 *
 * Everything here is counted, never asserted. The original design shipped a
 * "100% 2FA" tile and a "threat level: LOW" badge over an application that had
 * no second factor and no threat feed. A figure that cannot be wrong because
 * nothing computes it is not a reassurance, it is a blindfold.
 */

export type SecurityPosture = {
  accounts: { total: number; active: number; inactive: number; admins: number; unassigned: number };
  policies: { id: string; label: string; description: string; enabled: boolean }[];
  session: { timeoutMinutes: number; totpEnforcement: string | null };
  password: { rules: { label: string; enabled: boolean; required: boolean }[] };
  events: AuditEntry[];
  /** Accounts with an admin portal but no role — they can reach the shell and nothing else. */
  danglingAdmins: { id: string; email: string; full_name: string }[];
};

export async function getSecurityPosture(): Promise<SecurityPosture> {
  noStore();
  const supabase = await createClient();

  const [profilesRes, policyRes, isolationRes, eventsRes] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, portal, role_id, is_active"),
    supabase.from("security_policies").select("*").maybeSingle(),
    supabase.from("isolation_policies").select("id, label, description, enabled").order("label"),
    supabase
      .from("audit_log")
      .select("*")
      .in("severity", ["warning", "critical"])
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const profiles = profilesRes.data ?? [];
  const policy = policyRes.data as Record<string, unknown> | null;

  // password_rules is a JSONB array on the singleton row, written by the
  // Access Control console. Read as-is rather than restated here, so the two
  // screens cannot disagree about what is enforced.
  const passwordRules = (policy?.password_rules ?? []) as Array<{
    id: string;
    label: string;
    locked: boolean;
    enabled: boolean;
  }>;

  return {
    accounts: {
      total: profiles.length,
      active: profiles.filter((p) => p.is_active).length,
      inactive: profiles.filter((p) => !p.is_active).length,
      admins: profiles.filter((p) => p.portal === "ADMIN" && p.is_active).length,
      unassigned: profiles.filter((p) => !p.role_id).length,
    },
    policies: (isolationRes.data ?? []) as SecurityPosture["policies"],
    session: {
      timeoutMinutes: Number(policy?.session_timeout_minutes ?? 30),
      totpEnforcement: (policy?.totp_enforcement as string) ?? null,
    },
    password: {
      rules: passwordRules.map((r) => ({
        label: r.label,
        required: r.locked,
        enabled: r.enabled,
      })),
    },
    events: (eventsRes.data ?? []) as AuditEntry[],
    danglingAdmins: profiles
      .filter((p) => p.portal === "ADMIN" && p.is_active && !p.role_id)
      .map((p) => ({ id: p.id, email: p.email, full_name: p.full_name })),
  };
}
