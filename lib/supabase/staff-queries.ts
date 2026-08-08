import { createClient } from "./server";
import type { Department, TeamMember } from "@/lib/team";

/**
 * The public staff roster.
 *
 * Returns the `TeamMember` shape the About page already renders, so the
 * component did not have to change. Identity comes from `profiles` and the
 * public attributes from `staff_profiles` — the join is the point of splitting
 * them, since a name lives in exactly one place.
 *
 * RLS does the filtering: anon can only see rows where `is_public` is true, so
 * this cannot accidentally publish an internal record even if the query
 * forgets a `where`.
 */
export async function listPublicStaff(): Promise<TeamMember[]> {
  const supabase = await createClient();

  // Reads the public_staff view, not the table. The About page renders with
  // the anon key and `profiles` has no anon policy — joining to it directly
  // returned null names and silently produced an empty roster.
  const { data } = await supabase
    .from("public_staff")
    .select("id, slug, display_role, department, skills, full_name, avatar_url")
    .order("display_order");

  return ((data ?? []) as unknown as Array<{
    id: string;
    slug: string;
    display_role: string;
    department: Department | null;
    skills: string[];
    full_name: string;
    avatar_url: string | null;
  }>)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.full_name,
      role: r.display_role,
      department: (r.department ?? "Core Engineering") as Department,
      skills: r.skills ?? [],
      portrait: r.avatar_url ?? "",
    }));
}

/**
 * Everyone who can appear as a project lead, task assignee or attendee,
 * keyed by profile id.
 *
 * The portal components used to resolve people against the static `leadership`
 * array in lib/team.ts. Its ids are slugs ("alex-vance") while every real
 * lead_id and assignee_id is a UUID, so after the data moved to Postgres every
 * lookup missed. The guards meant nothing wrong was shown — names and avatars
 * simply stopped rendering, silently, with no error anywhere.
 *
 * Returned as a plain record because the consumers are client components: a Map
 * does not survive the server/client boundary, and passing the whole roster to
 * each one would ship it several times over.
 */
export type PersonDirectory = Record<string, { name: string; avatarUrl: string | null }>;

export async function getPeopleDirectory(): Promise<PersonDirectory> {
  const supabase = await createClient();

  // public_staff, not profiles: the About page reads with the anon key and
  // profiles has no anon policy, so joining it directly returns null names.
  const { data } = await supabase.from("public_staff").select("id, full_name, avatar_url");

  return Object.fromEntries(
    ((data ?? []) as unknown as { id: string; full_name: string; avatar_url: string | null }[])
      .map((p) => [p.id, { name: p.full_name, avatarUrl: p.avatar_url }])
  );
}
