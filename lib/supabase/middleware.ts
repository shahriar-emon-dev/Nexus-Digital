import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
  user: { id: string; portal: Portal; roleId: string | null; isActive: boolean } | null;
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

  return {
    response,
    user: {
      id: user.id,
      portal: profile.portal,
      roleId: profile.role_id,
      isActive: profile.is_active,
    },
  };
}
