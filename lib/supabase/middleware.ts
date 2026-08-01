import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { ruleForRoute } from "@/lib/access-control";
import type { AccessLevel } from "@/lib/access-control";
import type { Database, Portal } from "./types";

/**
 * Refreshes the Supabase session on every matched request and returns both the
 * response carrying the rotated cookies and the resolved identity.
 *
 * Middleware is the only place in the App Router that can reliably write auth
 * cookies, so token refresh has to live here. The returned `response` must be
 * the one that is ultimately sent, or the rotated tokens are dropped and the
 * user is silently signed out when the access token expires.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: {
    id: string;
    portal: Portal;
    roleId: string | null;
    isActive: boolean;
    /** Grant on the module governing THIS request, resolved from the database. */
    grant: AccessLevel | null;
  } | null;
}> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser, not getSession: this revalidates the token against the auth
  // server. getSession trusts the cookie, which the client controls.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { response, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("portal, role_id, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) return { response, user: null };

  // Only the grant for the module governing this exact path is fetched — one
  // indexed primary-key lookup, not the whole matrix on every request.
  let grant: AccessLevel | null = null;
  const rule = ruleForRoute(request.nextUrl.pathname);
  if (rule && profile.role_id) {
    const { data: row } = await supabase
      .from("role_grants")
      .select("level")
      .eq("role_id", profile.role_id)
      .eq("module_id", rule.moduleId)
      .maybeSingle();
    grant = (row?.level as AccessLevel | undefined) ?? null;
  }

  return {
    response,
    user: {
      id: user.id,
      portal: profile.portal,
      roleId: profile.role_id,
      isActive: profile.is_active,
      grant,
    },
  };
}
