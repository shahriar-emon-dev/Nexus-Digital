import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: In the next pass, replace stub logic with real NextAuth.js v5 getToken / auth() check.
// Currently stubbed to verify route matching on role-gated paths (/admin, /staff, /client).

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Placeholder stub: In production, extract JWT token and check `token.role`.
  // Example: const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Stub logging for development verification
  // console.log(`[Middleware Stub] Intercepted role-gated path: ${pathname}`);

  if (pathname.startsWith("/admin")) {
    // TODO: Verify token?.role === 'ADMIN', otherwise redirect to /auth/login
    // if (!token || token.role !== 'ADMIN') return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (pathname.startsWith("/staff")) {
    // TODO: Verify token?.role === 'STAFF', otherwise redirect to /auth/login
    // if (!token || token.role !== 'STAFF') return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (pathname.startsWith("/client")) {
    // TODO: Verify token?.role === 'CLIENT', otherwise redirect to /auth/login
    // if (!token || token.role !== 'CLIENT') return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/client/:path*"],
};
