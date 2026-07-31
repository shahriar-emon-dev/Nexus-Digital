import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { roleCanAccessRoute } from "@/lib/access-control";
import { updateSession } from "@/lib/supabase/middleware";
import type { Portal } from "@/lib/supabase/types";

/**
 * Session refresh and role gating for the three portals.
 *
 * The session is now real: `updateSession` revalidates the Supabase access
 * token against the auth server and rotates the cookies, and the portal and
 * role are read from `public.profiles` rather than from a client-settable
 * cookie.
 */

const homeFor: Record<Portal, string> = {
  ADMIN: "/admin",
  STAFF: "/staff",
  CLIENT: "/client",
};

const portalFor = (pathname: string): Portal | null =>
  pathname.startsWith("/admin")
    ? "ADMIN"
    : pathname.startsWith("/staff")
      ? "STAFF"
      : pathname.startsWith("/client")
        ? "CLIENT"
        : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always run the refresh, even on /auth, so a session that expires while the
  // user sits on the sign-in page is cleaned up rather than left stale.
  const { response, user } = await updateSession(request);

  const required = portalFor(pathname);
  if (!required) {
    // Already signed in and heading for the sign-in page? Send them to their
    // own portal instead of showing a form they do not need.
    if (user && user.isActive && pathname === "/auth/login") {
      return NextResponse.redirect(new URL(homeFor[user.portal], request.url));
    }
    return response;
  }

  // Not signed in. Preserve the destination so sign-in can return them there.
  if (!user) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Deactivated accounts keep a valid token until it expires; the profile flag
  // is what actually revokes access.
  if (!user.isActive) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("error", "account-disabled");
    return NextResponse.redirect(url);
  }

  // Signed in but on the wrong portal — send them to their own. Bouncing an
  // already-authenticated user back to the sign-in form is a navigation loop.
  if (user.portal !== required) {
    return NextResponse.redirect(new URL(homeFor[user.portal], request.url));
  }

  // Right portal, but the role's grant on the module governing this route is
  // below the minimum the route requires.
  if (required === "ADMIN" && user.roleId && !roleCanAccessRoute(user.roleId, pathname)) {
    const url = new URL("/admin", request.url);
    url.searchParams.set("denied", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
    "/client/:path*",
    "/auth/:path*",
  ],
};
