import type { NextAuthConfig } from "next-auth";

// TODO: Implement NextAuth.js v5 (Auth.js) configuration in the next pass.
// This will include:
// 1. Credentials provider with bcrypt password verification
// 2. Optional Google OAuth provider
// 3. JWT callback to embed `role` and `staffRole` into session token
// 4. Session callback to expose role on `session.user`
// 5. Upstash Redis session/token tracking or Prisma adapter

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      // TODO: Add role and staffRole to JWT token
      if (user) {
        // token.role = user.role;
        // token.staffRole = user.staffRole;
      }
      return token;
    },
    async session({ session, token }) {
      // TODO: Pass role and staffRole to client session
      if (session.user && token) {
        // session.user.role = token.role as Role;
        // session.user.staffRole = token.staffRole as StaffRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
};
