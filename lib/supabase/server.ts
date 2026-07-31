import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./types";

/**
 * Server Supabase client for Server Components, Server Actions and Route
 * Handlers.
 *
 * Server Components cannot write cookies. The `setAll` swallow below is
 * deliberate and is the documented pattern: token refresh is performed in
 * middleware, which *can* write, so a failed write here is always a duplicate
 * of work already done rather than a lost session.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware owns the refresh.
          }
        },
      },
    }
  );
}

/**
 * The signed-in user's identity, or null.
 *
 * Always resolved with `getUser()`, never `getSession()`. `getSession` reads
 * the cookie without contacting the auth server, so its payload is
 * attacker-supplied and must not be trusted for authorisation.
 */
export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(id, name, description)")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}
