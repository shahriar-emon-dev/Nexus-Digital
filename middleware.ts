import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { roleCanAccessRoute } from "@/lib/access-control";

/**
 * Role gating for the three portals.
 *
 * There is no auth provider wired yet (`lib/auth.ts` has no providers and there
 * is no database), so there is no session to read. Rather than leave this a
 * no-op with three empty `if` blocks, the enforcement is written for real and
 * driven by a single session claim; only the *source* of that claim is stubbed.
 *
 * When NextAuth lands, replace `readSession` with `getToken({ req })` and
 * change nothing else — the portal gate and the per-module gate below are the
 * real rules, and they already read the same matrix the Access Control console
 * edits.
 */

type Portal = "ADMIN" | "STAFF" | "CLIENT";

type Session = { portal: Portal; roleId: string } | null;

/**
 * Enforcement is opt-in until auth exists. With no provider there is no way to
 * obtain a session, so defaulting this on would lock every portal behind a
 * login that cannot succeed.
 */
const AUTH_ENFORCED = process.env.AUTH_ENFORCED === "true";

/**
 * Dev cookies stand in for the session claim so the gate is exercisable before
 * auth is wired. `getToken` replaces this wholesale.
 */
function readSession(request: NextRequest): Session {
  const portal = request.cookies.get("nexus-portal")?.value as Portal | undefined;
  if (!portal || !(portal in homeFor)) return null;
  return { portal, roleId: request.cookies.get("nexus-role")?.value ?? "global-admin" };
}

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const required = portalFor(pathname);
  if (!required) return NextResponse.next();

  const session = readSession(request);

  // No session. Send to sign-in, remembering the destination so login can
  // return them there rather than dumping them on a generic home.
  if (!session) {
    if (!AUTH_ENFORCED) return NextResponse.next();
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in but on the wrong portal — send them to their own. Bouncing an
  // already-authenticated user back to the sign-in form is a navigation loop.
  if (session.portal !== required) {
    return NextResponse.redirect(new URL(homeFor[session.portal], request.url));
  }

  // Right portal, but the role's grant on the module governing this route is
  // below the minimum the route requires.
  if (required === "ADMIN" && !roleCanAccessRoute(session.roleId, pathname)) {
    const url = new URL("/admin", request.url);
    url.searchParams.set("denied", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/client/:path*"],
};
