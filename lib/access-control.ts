/**
 * Access control & security policy.
 *
 * Single source of truth for the permission model. Shaped for the tables it
 * will become — `Role`, `PermissionGrant`, `SecurityPolicy`, `NetworkRule` —
 * so the console, the middleware and (later) the server all read the same
 * definitions rather than each keeping its own copy.
 *
 * Everything the console displays as a headline figure is DERIVED at the
 * bottom of this file. Nothing is hardcoded: a 2FA rate that does not match
 * the member records behind it is worse than no figure at all.
 */

/* ---------------------------------------------------------------- roles --- */

export type AccessLevel = "none" | "audit" | "view" | "edit" | "admin" | "full";

/** Ordered weakest → strongest. Used for comparison and for the editor. */
export const accessLevels: { value: AccessLevel; label: string; short: string }[] = [
  { value: "none", label: "No access", short: "No Access" },
  { value: "audit", label: "Audit only", short: "Audit Only" },
  { value: "view", label: "View only", short: "View Only" },
  { value: "edit", label: "View and edit", short: "View/Edit" },
  { value: "admin", label: "Module administrator", short: "Admin" },
  { value: "full", label: "Full control", short: "Full" },
];

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
  /** Short line shown under the column header and in the role editor. */
  description: string;
  /** System roles cannot be deleted — only their grants can be edited. */
  isSystem: boolean;
  /** Head count carrying this role. Drives the 2FA enrolment maths. */
  memberCount: number;
  /** Members of this role with a TOTP authenticator registered. */
  totpEnrolled: number;
  /** Live sessions attributed to this role right now. */
  activeSessions: number;
};

export const roles: Role[] = [
  {
    id: "senior-specialist",
    name: "Senior Specialist",
    description: "Delivery ICs — own their service line, no financial reach.",
    isSystem: true,
    memberCount: 34,
    totpEnrolled: 34,
    activeSessions: 412,
  },
  {
    id: "project-lead",
    name: "Project Lead",
    description: "Accountable for engagements, staffing and client comms.",
    isSystem: true,
    memberCount: 12,
    totpEnrolled: 12,
    activeSessions: 268,
  },
  {
    id: "financial-auditor",
    name: "Financial Auditor",
    description: "Read-only across the business, write access to ledgers.",
    isSystem: true,
    memberCount: 4,
    totpEnrolled: 4,
    activeSessions: 61,
  },
  {
    id: "global-admin",
    name: "Global Admin",
    description: "Unrestricted. Every grant is logged to the audit trail.",
    isSystem: true,
    memberCount: 3,
    totpEnrolled: 3,
    activeSessions: 27,
  },
];

/* --------------------------------------------------- permission modules --- */

export type PermissionModule = {
  id: string;
  label: string;
  description: string;
  /** Modules holding regulated or personal data are flagged in the matrix. */
  sensitive: boolean;
};

export const permissionModules: PermissionModule[] = [
  {
    id: "service-management",
    label: "Service Management",
    description: "Service catalogue, packages and published pricing.",
    sensitive: false,
  },
  {
    id: "financial-systems",
    label: "Financial Systems",
    description: "Invoices, payments, tax reporting and revenue.",
    sensitive: true,
  },
  {
    id: "crm-database",
    label: "CRM Database",
    description: "Client organisations, contacts and engagement history.",
    sensitive: true,
  },
  {
    id: "staff-hr-records",
    label: "Staff & HR Records",
    description: "Employment records, compensation and performance.",
    sensitive: true,
  },
  {
    id: "security-policies",
    label: "Security Policies",
    description: "This console, API credentials and the audit trail.",
    sensitive: true,
  },
  {
    id: "content-publishing",
    label: "Content & Publishing",
    description: "Blog, landing pages, case studies and site metadata.",
    sensitive: false,
  },
];

/**
 * The grant table. `roleMatrix[moduleId][roleId]`.
 *
 * A missing entry means `none` — but every cell is written out explicitly,
 * because an implicit denial is the kind of thing that gets misread during a
 * security review.
 */
export const roleMatrix: Record<string, Record<string, AccessLevel>> = {
  "service-management": {
    "senior-specialist": "edit",
    "project-lead": "admin",
    "financial-auditor": "none",
    "global-admin": "full",
  },
  "financial-systems": {
    "senior-specialist": "none",
    "project-lead": "view",
    "financial-auditor": "admin",
    "global-admin": "full",
  },
  "crm-database": {
    "senior-specialist": "edit",
    "project-lead": "edit",
    "financial-auditor": "view",
    "global-admin": "full",
  },
  "staff-hr-records": {
    "senior-specialist": "none",
    "project-lead": "edit",
    "financial-auditor": "none",
    "global-admin": "full",
  },
  "security-policies": {
    "senior-specialist": "none",
    "project-lead": "none",
    "financial-auditor": "audit",
    "global-admin": "full",
  },
  "content-publishing": {
    "senior-specialist": "edit",
    "project-lead": "admin",
    "financial-auditor": "none",
    "global-admin": "full",
  },
};

/* ------------------------------------------------ authentication policy --- */

export type TotpEnforcement = "mandatory" | "optional";

export type PasswordRule = {
  id: string;
  label: string;
  enabled: boolean;
  /** Rules required by policy cannot be switched off from the console. */
  locked: boolean;
};

export type AuthPolicy = {
  totpEnforcement: TotpEnforcement;
  sessionTimeoutMinutes: number;
  passwordRules: PasswordRule[];
};

export const sessionTimeoutOptions = [15, 30, 60] as const;

export const authPolicy: AuthPolicy = {
  totpEnforcement: "mandatory",
  sessionTimeoutMinutes: 30,
  passwordRules: [
    { id: "length", label: "Minimum 12 characters", enabled: true, locked: true },
    { id: "special", label: "Special character required", enabled: true, locked: true },
    { id: "numeric", label: "Numeric character required", enabled: true, locked: false },
    { id: "reuse", label: "Block reuse of last 5 passwords", enabled: true, locked: false },
    { id: "rotation", label: "Force rotation every 90 days", enabled: false, locked: false },
  ],
};

/* ------------------------------------------------------ network policy --- */

export type NetworkPolicy = {
  ipRanges: string[];
  geoFencing: { enabled: boolean; regions: string[] };
};

export const networkPolicy: NetworkPolicy = {
  ipRanges: ["192.168.1.0/24", "10.0.0.1 - 10.0.0.255", "203.0.113.0/28"],
  geoFencing: { enabled: true, regions: ["Germany", "United Kingdom", "France"] },
};

/** Offered when adding a region. Kept here so the console has no literals. */
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

/* ------------------------------------------------- isolation policies ---- */

export type IsolationPolicy = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  /** Which module the rule narrows — links the toggle back to the matrix. */
  moduleId: string;
  tone: "brand" | "ion";
};

export const isolationPolicies: IsolationPolicy[] = [
  {
    id: "billing-isolation",
    label: "Billing Isolation",
    description: "Hide financial records from everyone below auditor grant.",
    enabled: true,
    moduleId: "financial-systems",
    tone: "brand",
  },
  {
    id: "crm-restrictions",
    label: "CRM Restrictions",
    description: "Limit client records to the assigned account manager.",
    enabled: false,
    moduleId: "crm-database",
    tone: "ion",
  },
  {
    id: "hr-confidentiality",
    label: "HR Confidentiality",
    description: "Compensation fields visible to Global Admin only.",
    enabled: true,
    moduleId: "staff-hr-records",
    tone: "ion",
  },
  {
    id: "content-embargo",
    label: "Publishing Embargo",
    description: "Require a second approval before anything goes live.",
    enabled: false,
    moduleId: "content-publishing",
    tone: "brand",
  },
];

/* ------------------------------------------------------ derived posture --- */

const totalMembers = roles.reduce((n, r) => n + r.memberCount, 0);
const totalEnrolled = roles.reduce((n, r) => n + r.totpEnrolled, 0);

/**
 * Threat level is computed from the policy itself rather than asserted, so it
 * cannot disagree with the controls shown on the same screen.
 */
function deriveThreatLevel(): { level: "LOW" | "ELEVATED" | "HIGH"; reason: string } {
  const gaps: string[] = [];
  if (totalEnrolled < totalMembers) gaps.push("incomplete 2FA enrolment");
  if (authPolicy.totpEnforcement !== "mandatory") gaps.push("TOTP is optional");
  if (networkPolicy.ipRanges.length === 0) gaps.push("no IP allow-list");
  if (accessLevelRank[roleMatrix["security-policies"]["financial-auditor"]] > accessLevelRank.audit)
    gaps.push("auditor can write security policy");

  if (gaps.length === 0)
    return { level: "LOW", reason: "All baseline controls are enforced." };
  if (gaps.length === 1) return { level: "ELEVATED", reason: `1 gap: ${gaps[0]}.` };
  return { level: "HIGH", reason: `${gaps.length} gaps: ${gaps.join(", ")}.` };
}

export const securityPosture = {
  totalMembers,
  totpEnrolled: totalEnrolled,
  /** Rounded for display; the raw fraction is kept beside it for the caption. */
  totpEnrolmentRate: Math.round((totalEnrolled / totalMembers) * 100),
  activeSessions: roles.reduce((n, r) => n + r.activeSessions, 0),
  privilegedAccounts: roles
    .filter((r) => accessLevelRank[roleMatrix["security-policies"][r.id] ?? "none"] >= accessLevelRank.admin)
    .reduce((n, r) => n + r.memberCount, 0),
  threat: deriveThreatLevel(),
};

/** Count of grants at `admin` or above, used by the matrix footer. */
export const elevatedGrantCount = permissionModules.reduce(
  (n, m) =>
    n +
    roles.filter((r) => accessLevelRank[roleMatrix[m.id]?.[r.id] ?? "none"] >= accessLevelRank.admin)
      .length,
  0
);

/* ------------------------------------------- route → module enforcement --- */

/**
 * Maps a URL prefix to the module that governs it. The middleware uses this to
 * decide whether a role may open a route, so the matrix on screen is the same
 * matrix that gates navigation — there is no second list to keep in sync.
 *
 * Longest prefix wins, so `/admin/invoices` beats `/admin`.
 */
export const routeModuleMap: { prefix: string; moduleId: string; minimum: AccessLevel }[] = [
  { prefix: "/admin/access-control", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/settings/security", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/audit-logs", moduleId: "security-policies", minimum: "audit" },
  { prefix: "/admin/keys", moduleId: "security-policies", minimum: "admin" },
  { prefix: "/admin/invoices", moduleId: "financial-systems", minimum: "view" },
  { prefix: "/admin/clients", moduleId: "crm-database", minimum: "view" },
  { prefix: "/admin/staff", moduleId: "staff-hr-records", minimum: "view" },
  { prefix: "/admin/services", moduleId: "service-management", minimum: "view" },
  { prefix: "/admin/content", moduleId: "content-publishing", minimum: "view" },
];

/** `true` when the role's grant on the governing module clears the minimum. */
export function roleCanAccessRoute(roleId: string, pathname: string): boolean {
  const rule = [...routeModuleMap]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return true;
  const granted = roleMatrix[rule.moduleId]?.[roleId] ?? "none";
  return accessLevelRank[granted] >= accessLevelRank[rule.minimum];
}
