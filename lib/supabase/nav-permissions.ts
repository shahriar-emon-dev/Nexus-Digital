import type { Grants } from "@/lib/nav-filter";
import type { AccessLevel } from "@/lib/access-control";
import { createClient } from "./server";

/**
 * Server-only: resolves every grant held by a role as plain `moduleId -> level`
 * data, which is what crosses to the client. The filtering itself lives in
 * lib/nav-filter.ts because nav items carry React components that cannot be
 * serialised across the boundary.
 */
export async function getGrantsForRole(roleId: string | null): Promise<Grants> {
  if (!roleId) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("role_grants")
    .select("module_id, level")
    .eq("role_id", roleId);

  return Object.fromEntries((data ?? []).map((g) => [g.module_id, g.level as AccessLevel]));
}
