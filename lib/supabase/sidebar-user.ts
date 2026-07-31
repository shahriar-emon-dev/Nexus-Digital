import { getMyProfile } from "./profile-actions";
import type { SidebarUser } from "@/components/layout/Sidebar";

/**
 * Resolves the signed-in person into the shape the sidebars render.
 *
 * Returns `undefined` when there is no session so the sidebar falls back to its
 * own default rather than rendering an empty avatar. In practice the middleware
 * redirects first, so that path is only reachable during a signed-out preview.
 */
export async function getSidebarUser(
  fallbackRole: string
): Promise<SidebarUser | undefined> {
  const profile = await getMyProfile();
  if (!profile) return undefined;

  return {
    name: profile.full_name || profile.email,
    // Role label priority: assigned role, then job title, then the portal's
    // generic label — so the sidebar never shows a blank subtitle.
    role: profile.roles?.name ?? profile.job_title ?? fallbackRole,
    email: profile.email,
    avatar: profile.avatar_url ?? undefined,
  };
}
