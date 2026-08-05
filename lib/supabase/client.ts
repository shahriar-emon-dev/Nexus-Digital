"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Browser Supabase client.
 *
 * The publishable key is meant to ship to the browser — row level security is
 * what protects the data, not key secrecy. Never put the service role key
 * anywhere a client bundle can reach.
 *
 * Two things this does that the bare factory call does not:
 *
 * 1. Returns a singleton. Every component calling `createClient()` used to get
 *    its own instance, which meant a separate realtime socket per subscriber.
 *
 * 2. Authorises the realtime socket. Realtime authenticates SEPARATELY from
 *    PostgREST — the session cookie gets a channel connected, but RLS on
 *    `postgres_changes` is evaluated against whatever token was handed to
 *    `realtime.setAuth`. Without it the channel reports SUBSCRIBED, receives
 *    nothing, and reports no error: every subscription in the app looked
 *    connected while silently delivering zero events.
 */
let client: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Fires immediately with the current session, then on every sign-in, refresh
  // and sign-out — so the socket's token never goes stale behind the cookie.
  client.auth.onAuthStateChange((_event, session) => {
    client!.realtime.setAuth(session?.access_token ?? null);
  });

  return client;
}
