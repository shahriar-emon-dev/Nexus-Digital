/**
 * Turns a Supabase auth error into something a person can act on.
 *
 * WHY THIS EXISTS. Every auth action returned `error.message` verbatim. For a
 * wrong password that is exactly right — Supabase deliberately returns the same
 * text for an unknown address and a bad password, and rewording it risks
 * turning the sign-in form into an account-enumeration oracle.
 *
 * For a *transport* failure it is not right at all. When the auth host cannot
 * be reached, supabase-js tries to parse the intermediary's plain-text reply as
 * JSON and the message that reaches the form is:
 *
 *     Unexpected token 'H', "Host not i"... is not valid JSON
 *
 * The end-to-end suite hit this on its first run against an environment with no
 * route to the auth host. Someone seeing that on a sign-in page has no way to
 * know it means "we are down, not you" — they will assume they mistyped, retry,
 * and eventually give up. Worse, it names an internal component in a message
 * shown to anonymous visitors.
 *
 * So: transport and rate-limit failures get written; everything else is passed
 * through untouched, because Supabase's own wording for credential problems is
 * chosen for a reason.
 *
 * This is a plain module, not a `"use server"` one — it exports a synchronous
 * function, which a Server Actions file may not do.
 */

type SupabaseAuthError = {
  message: string;
  status?: number;
  code?: string;
  name?: string;
};

/**
 * A failure to *reach* the service rather than a failure *at* it. supabase-js
 * surfaces these inconsistently — sometimes a named class, sometimes status 0,
 * sometimes only a parse error from a proxy's HTML or plain-text body — so all
 * three shapes are recognised.
 */
function isUnreachable(error: SupabaseAuthError): boolean {
  if (error.name === "AuthRetryableFetchError") return true;
  if (error.status === 0 || error.status === undefined) {
    // A JSON parse failure means the reply never came from the auth API.
    if (/is not valid JSON|Unexpected token|Failed to fetch|fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(error.message)) {
      return true;
    }
  }
  return /is not valid JSON|fetch failed|Failed to fetch/i.test(error.message);
}

export function authErrorMessage(error: SupabaseAuthError): string {
  if (isUnreachable(error)) {
    return "We could not reach the authentication service. This is on our side — please try again in a moment.";
  }

  // Supabase's own throttle. The raw text ("For security purposes, you can only
  // request this after N seconds") is fine, but a 429 with no body is not.
  if (error.status === 429) {
    return error.message?.trim()
      ? error.message
      : "Too many attempts. Wait a minute and try again.";
  }

  if (typeof error.status === "number" && error.status >= 500) {
    return "The authentication service is having trouble. Please try again shortly.";
  }

  // Credential errors, unverified email, weak password: Supabase's wording is
  // deliberate and non-enumerating. Leave it alone.
  return error.message;
}
