import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * The project detail screen already exists — it is the client portal view,
 * with the board, roadmap and budget. Building a second one for admins would
 * mean two screens rendering one project and drifting apart, so this resolves
 * the id and forwards to the one that exists.
 *
 * Accepts either the uuid or the slug, because both appear in links.
 */
export default async function AdminProjectRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Branching on shape rather than trying both: comparing a slug against a
  // uuid column is a Postgres type error, which fails the whole request.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data } = await supabase
    .from("projects")
    .select("slug")
    .eq(isUuid ? "id" : "slug", id)
    .maybeSingle();

  redirect(data?.slug ? `/client/projects/${data.slug}` : "/admin/projects");
}
