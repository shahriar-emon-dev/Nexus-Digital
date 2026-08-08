/**
 * Leadership roster. Shaped like the eventual `Staff` table (id, slug,
 * department, skills) rather than around the About page's card layout, so this
 * becomes a Prisma query without touching the components that read it.
 */
export type Department =
  | "Architectural Council"
  | "Growth Operations"
  | "Creative Engineering"
  | "Core Engineering";

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: Department;
  skills: string[];
  portrait: string;
};

export const departmentTone: Record<Department, string> = {
  // `-subtle` / `-subtle-fg` pairs, not `bg-X/20 text-X`. A colour on a tint of
  // itself lands around 3.4–4.4:1, under the 4.5 these small bold labels need.
  "Architectural Council": "bg-brand-subtle text-brand-subtle-fg",
  "Growth Operations": "bg-ion-subtle text-ion-subtle-fg",
  "Creative Engineering": "bg-chart-3-subtle text-chart-3-subtle-fg",
  "Core Engineering": "bg-chart-4-subtle text-chart-4-subtle-fg",
};

/* TODO: every `portrait` is a design-tool CDN URL and will expire. */
/*
 * The hardcoded `leadership` roster used to live here.
 *
 * Four portal components resolved people against it with
 * `leadership.find(m => m.id === leadId)`. Its ids are slugs; every real
 * lead_id and assignee_id is a UUID, so once the data moved to Postgres every
 * lookup missed — silently, because the guards meant names simply stopped
 * rendering rather than erroring. The About page also fell back to it whenever
 * no staff were published, which would have put five invented colleagues on the
 * public site.
 *
 * People now come from `public_staff` via getPeopleDirectory(). What remains
 * here is the vocabulary — the TeamMember shape and the department tone map.
 */
