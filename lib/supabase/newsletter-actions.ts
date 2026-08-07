"use server";

import { createClient } from "./server";

/**
 * Newsletter signups.
 *
 * Calls the RPC rather than inserting directly, for the same reason
 * `submit_lead` does: an anonymous INSERT ... RETURNING needs a SELECT policy on
 * the row, and anon must never be able to read this table — a subscriber list
 * readable by anyone is a harvesting target.
 */

type Result = { ok: true } | { error: string };

export async function subscribeToNewsletter(email: string, source = "footer"): Promise<Result> {
  const trimmed = email.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(trimmed)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("subscribe_newsletter", {
    p_email: trimmed,
    p_source: source,
  });

  if (error) {
    // Deliberately vague: distinguishing "already subscribed" from "new" would
    // let anyone test whether an address is on the list.
    return { error: "We could not record that just now. Please try again." };
  }

  return { ok: true };
}
