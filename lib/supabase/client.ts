"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

/**
 * Browser Supabase client.
 *
 * The publishable key is meant to ship to the browser — row level security is
 * what protects the data, not key secrecy. Never put the service role key
 * anywhere a client bundle can reach.
 *
 * `createBrowserClient` memoises internally, so calling this per component is
 * fine and keeps a single auth state across the tab.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
