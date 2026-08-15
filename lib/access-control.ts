/**
 * Access control — types and route configuration.
 *
 * The permission matrix, the module catalogue and the security policy now live
 * in the database (migration 0007). What stays here is the part that is genuinely
 * code configuration rather than business data: the mapping from URL prefixes to
 * the module that governs them.
 *
 * That map belongs in the repository because its left-hand side *is* the route
 * tree. A grant is data an administrator edits; a URL prefix is something a
 * developer creates by adding a folder, and a database row pointing at a route
 * that no longer exists is a silent hole rather than a visible one.
 */

/** Ascending privilege. Mirrors the `public.access_level` enum exactly. */
export type AccessLevel = "none" | "audit" | "view" | "edit" | "admin" | "full";

export const accessLevels: { value: AccessLevel; label: string; short: string }[] = [
  { value: "none", label: "No access", short: "No Access" },
  { value: "audit", label: "Audit only", short: "Audit Only" },
  { value: "view", label: "View only", short: "View Only" },
  { value: "edit", label: "View and edit", short: "View/Edit" },
  { value: "admin", label: "Module administrator", short: "Admin" },
  { value: "full", label: "Full control", short: "Full" },
];

/**
 * Client-side comparison only. Server-side authorisation compares the Postgres
 * enum directly (`level >= 'view'`), so this ladder never becomes the authority
 * — it exists so the console can sort and style cells without a round trip.
 */
export const accessLevelRank: Record<AccessLevel, number> = {
  none: 0,
  audit: 1,
  view: 2,
  edit: 3,
  admin: 4,
  full: 5,
};

export type Role = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  totpEnrolled: number;
  activeSessions: number;
};

export type PermissionModule = {
  id: string;
  label: string;
  description: string;
  sensitive: boolean;
};

export type TotpEnforcement = "mandatory" | "optional";

export type PasswordRule = {
  id: string;
  label: string;
  enabled: boolean;
  locked: boolean;
};

export type IsolationPolicy = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  moduleId: string | null;
  tone: "brand" | "ion";
};

export const sessionTimeoutOptions = [15, 30, 60] as const;

/** Offered when adding a region. Presentation config, not business data. */
export const geoRegionOptions = [
  "Germany",
  "United Kingdom",
  "France",
  "Netherlands",
  "Ireland",
  "Spain",
  "Poland",
  "Sweden",
];

/**
 * Accepts a single IPv4 address, a CIDR block, or an inclusive `a - b` range.
 * Used by the console before a rule can be saved, so an unparseable rule never
 * reaches the policy.
 */
export function isValidIpRule(value: string): boolean {
  const v = value.trim();
  if (!v) return false;

  const octet = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
  const ip = `${octet}(\\.${octet}){3}`;

  if (new RegExp(`^${ip}$`).test(v)) return true;
  if (new RegExp(`^${ip}\\/([0-9]|[12]\\d|3[0-2])$`).test(v)) return true;
  if (new RegExp(`^${ip}\\s*-\\s*${ip}$`).test(v)) return true;
  return false;
}

/* ------------------------------------------- route → module enforcement --- */

/**
 * Maps a URL prefix to the module that governs it, and the minimum grant the
 * route requires. The middleware resolves a request against this, then checks
 * the role's grant on that module in the database.
 *
 * Longest prefix wins, so `/admin/invoices` beats `/admin`.
 *
 * COVERAGE. This used to list eleven prefixes against a tree of thirty-six
 * admin routes, and `grantClearsRoute` returns true for anything unmapped — so
 * /admin/leads, /admin/projects, /admin/reviews, /admin/database and the
 * analytics screens were reachable by any ADMIN-portal account regardless of
 * role. RLS still refused the data, but relying on that alone makes the
 * database the only line of defence.
 *
 * Every admin route that reads governed data now has a rule. Deliberately still
 * unmapped: `/admin` itself (the portal landing page, which must stay reachable
 * or the redirect target loops), `/admin/notifications` and `/admin/docs`
 * (per-user and static respectively), and `/admin/settings` root, whose
 * children carry their own stricter rules.
 */
export const routeModuleMap: { prefix: string; moduleId: string; minimum: AccessLevel }[] = [
  /* security-policies */
  { prefix: "/admin/access-control", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/settings/security", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/audit-logs", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/logs", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/keys", moduleId: "security-policies", minimum: "admin" },
  { prefix: "/admin/settings/users", moduleId: "security-policies", minimum: "admin" },
  { prefix: "/admin/settings/email", moduleId: "security-policies", minimum: "admin" },
  { prefix: "/admin/database", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/nodes", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/traffic", moduleId: "security-policies", minimum: "audit" },

  /* financial-systems */
  { prefix: "/admin/invoices", moduleId: "financial-systems", minimum: "view" },

  /* crm-database */
  { prefix: "/admin/clients", moduleId: "crm-database", minimum: "view" },
  { prefix: "/admin/leads", moduleId: "crm-database", minimum: "view" },
  { prefix: "/admin/projects", moduleId: "crm-database", minimum: "view" },
  { prefix: "/admin/meetings", moduleId: "crm-database", minimum: "view" },
  { prefix: "/admin/support", moduleId: "crm-database", minimum: "view" },

  /* staff-hr-records */
  { prefix: "/admin/staff", moduleId: "staff-hr-records", minimum: "view" },

  /* service-management */
  { prefix: "/admin/services", moduleId: "service-management", minimum: "view" },

  /* content-publishing */
  { prefix: "/admin/content", moduleId: "content-publishing", minimum: "view" },
  { prefix: "/admin/media", moduleId: "content-publishing", minimum: "view" },
  { prefix: "/admin/reviews", moduleId: "content-publishing", minimum: "view" },
  { prefix: "/admin/analytics", moduleId: "content-publishing", minimum: "view" },
];

/** The rule governing a path, or null when the route is ungated. */
export function ruleForRoute(pathname: string) {
  return (
    [...routeModuleMap]
      .sort((a, b) => b.prefix.length - a.prefix.length)
      .find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")) ?? null
  );
}

/**
 * `true` when the supplied grant clears the route's minimum.
 *
 * Takes the grant as an argument rather than reading it, so the caller decides
 * where it comes from — the middleware reads it from the database, and tests
 * can pass one directly.
 */
export function grantClearsRoute(
  granted: AccessLevel | null | undefined,
  pathname: string
): boolean {
  const rule = ruleForRoute(pathname);
  if (!rule) return true;
  return accessLevelRank[granted ?? "none"] >= accessLevelRank[rule.minimum];
}
