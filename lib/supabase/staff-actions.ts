"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * The staff roster and its capacity.
 *
 * Identity lives in `profiles`, public presentation in `staff_profiles`. The
 * split is the point: a person's name exists in exactly one place, and
 * publishing someone to the About page is a flag rather than a second copy of
 * their details.
 */

export type StaffRow = Database["public"]["Tables"]["staff_profiles"]["Row"];
export type Department = Database["public"]["Enums"]["department"];

export type StaffMember = StaffRow & {
  profiles: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    job_title: string | null;
    timezone: string;
    portal: Database["public"]["Enums"]["portal"];
    is_active: boolean;
  } | null;
  utilisation: {
    capacityHours: number;
    assignedHours: number;
    projectCount: number;
    /** Null when capacity is zero — dividing by it would invent a number. */
    pct: number | null;
  };
};

export async function listStaff(): Promise<StaffMember[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("staff_profiles")
    .select(
      "*, profiles ( id, full_name, email, avatar_url, job_title, timezone, portal, is_active )"
    )
    .order("display_order")
    .order("slug");

  const rows = (data ?? []) as unknown as Array<StaffRow & { profiles: StaffMember["profiles"] }>;
  if (rows.length === 0) return [];

  // A view, so it cannot be embedded — PostgREST resolves embeds through
  // foreign key metadata that a view does not carry.
  const { data: util } = await supabase
    .from("staff_utilisation")
    .select("profile_id, capacity_hours, assigned_hours, project_count, utilisation_pct")
    .in("profile_id", rows.map((r) => r.id));

  const byId = new Map(
    (util ?? []).map((u) => [
      u.profile_id as string,
      {
        capacityHours: Number(u.capacity_hours ?? 0),
        assignedHours: Number(u.assigned_hours ?? 0),
        projectCount: Number(u.project_count ?? 0),
        pct: u.utilisation_pct === null ? null : Number(u.utilisation_pct),
      },
    ])
  );

  return rows.map((r) => ({
    ...r,
    utilisation:
      byId.get(r.id) ?? { capacityHours: 0, assignedHours: 0, projectCount: 0, pct: null },
  }));
}

/** Accounts on the staff or admin portal that have no roster entry yet. */
export async function listUnrosteredProfiles(): Promise<
  { id: string; full_name: string; email: string }[]
> {
  const supabase = await createClient();
  const [profilesRes, staffRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("portal", ["STAFF", "ADMIN"])
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("staff_profiles").select("id"),
  ]);

  const rostered = new Set((staffRes.data ?? []).map((s) => s.id as string));
  return ((profilesRes.data ?? []) as { id: string; full_name: string; email: string }[]).filter(
    (p) => !rostered.has(p.id)
  );
}

export type StaffAssignment = {
  id: string;
  projectId: string;
  projectName: string;
  profileId: string;
  roleOnProject: string;
  hoursPerWeek: number;
  startsOn: string | null;
  endsOn: string | null;
};

export async function listAssignments(): Promise<StaffAssignment[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_assignments")
    .select("id, project_id, profile_id, role_on_project, hours_per_week, starts_on, ends_on, projects ( name )")
    .order("created_at");

  return ((data ?? []) as unknown as Array<{
    id: string;
    project_id: string;
    profile_id: string;
    role_on_project: string;
    hours_per_week: number;
    starts_on: string | null;
    ends_on: string | null;
    projects: { name: string } | null;
  }>).map((a) => ({
    id: a.id,
    projectId: a.project_id,
    projectName: a.projects?.name ?? "Unknown project",
    profileId: a.profile_id,
    roleOnProject: a.role_on_project,
    hoursPerWeek: Number(a.hours_per_week),
    startsOn: a.starts_on,
    endsOn: a.ends_on,
  }));
}

/* ------------------------------------------------------------ mutations -- */

type Result = { ok: true } | { error: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export async function addToRoster(form: FormData): Promise<Result> {
  const supabase = await createClient();

  const profileId = String(form.get("profileId") ?? "").trim();
  if (!profileId) return { error: "Choose an account to add." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return { error: "That account no longer exists." };

  const base = slugify(String(profile.full_name || profile.email)) || "member";
  // One statement instead of up to 48 sequential round trips. The unique
  // constraint still backs this; the RPC just stops the happy path from
  // polling and stops a race surfacing as a raw constraint error.
  const { data: allocated } = await supabase.rpc("next_available_slug", {
    p_table: "staff_profiles",
    p_base: base,
  });
  // Falls back to the base when the RPC is unavailable; the unique constraint
  // is still the thing that actually guarantees uniqueness.
  const slug = allocated ?? base;

  const { error } = await supabase.from("staff_profiles").insert({
    id: profileId,
    slug,
    display_role: String(form.get("displayRole") ?? "").trim() || "Specialist",
    department: (String(form.get("department") ?? "").trim() || null) as Department | null,
    weekly_capacity_hours: Number(form.get("capacityHours") ?? 40),
    seniority: String(form.get("seniority") ?? "").trim() || null,
    // Publishing to the public About page is an explicit act, never a default.
    is_public: false,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  revalidatePath("/about");
  return { ok: true };
}

export async function updateStaff(id: string, form: FormData): Promise<Result> {
  const supabase = await createClient();

  const capacity = Number(form.get("capacityHours") ?? 40);
  if (!Number.isFinite(capacity) || capacity < 0 || capacity > 168) {
    return { error: "Weekly capacity must be between 0 and 168 hours." };
  }

  const skills = String(form.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("staff_profiles")
    .update({
      display_role: String(form.get("displayRole") ?? "").trim() || "Specialist",
      department: (String(form.get("department") ?? "").trim() || null) as Department | null,
      seniority: String(form.get("seniority") ?? "").trim() || null,
      weekly_capacity_hours: capacity,
      is_billable: form.get("isBillable") === "on",
      skills,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  revalidatePath("/about");
  return { ok: true };
}

export async function setStaffPublic(id: string, isPublic: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_profiles")
    .update({ is_public: isPublic })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  revalidatePath("/about");
  return { ok: true };
}

export async function removeFromRoster(id: string): Promise<Result> {
  const supabase = await createClient();
  // Removes the roster entry only. The account itself is untouched, because
  // taking someone off the team page should never delete their login.
  const { error } = await supabase.from("staff_profiles").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  revalidatePath("/about");
  return { ok: true };
}

export async function saveAssignment(form: FormData): Promise<Result> {
  const supabase = await createClient();

  const projectId = String(form.get("projectId") ?? "").trim();
  const profileId = String(form.get("profileId") ?? "").trim();
  const hours = Number(form.get("hoursPerWeek") ?? 0);

  if (!projectId) return { error: "Choose a project." };
  if (!profileId) return { error: "Choose a person." };
  if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
    return { error: "Hours per week must be between 0 and 168." };
  }

  const startsOn = String(form.get("startsOn") ?? "").trim() || null;
  const endsOn = String(form.get("endsOn") ?? "").trim() || null;
  if (startsOn && endsOn && endsOn < startsOn) {
    return { error: "The end date cannot fall before the start date." };
  }

  const { error } = await supabase.from("project_assignments").upsert(
    {
      project_id: projectId,
      profile_id: profileId,
      role_on_project: String(form.get("roleOnProject") ?? "").trim(),
      hours_per_week: hours,
      starts_on: startsOn,
      ends_on: endsOn,
    },
    { onConflict: "project_id,profile_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  revalidatePath("/admin/staff/allocation");
  revalidatePath("/admin/projects");
  return { ok: true };
}

export async function removeAssignment(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_assignments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  revalidatePath("/admin/staff/allocation");
  revalidatePath("/admin/projects");
  return { ok: true };
}
