import { test } from "@playwright/test";

/**
 * Is the Supabase project reachable from wherever these tests are running?
 *
 * Two tiers of assertion live in this suite:
 *
 *   ROUTING TIER — middleware, the auth wall, form validation, 404s, response
 *   headers. None of it touches the database, so it is meaningful anywhere.
 *
 *   DATA TIER — signing in, submitting an enquiry, reading the live services
 *   catalogue. Meaningless without a backend.
 *
 * A sandbox or a CI runner with no egress to the project host would turn every
 * data-tier assertion into a green tick for the wrong reason: the page renders
 * its empty state, the locator finds nothing, and a lenient assertion passes.
 * That is worse than no test, because it reports coverage that does not exist.
 *
 * So the tier is gated on an explicit probe, and a skipped test says loudly
 * that it was skipped. `requireBackend()` never silently degrades.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let cached: Promise<boolean> | null = null;

export function backendReachable(): Promise<boolean> {
  if (!url || !key) return Promise.resolve(false);
  if (cached) return cached;

  cached = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: key },
        signal: controller.signal,
      });
      clearTimeout(timer);
      // Any HTTP reply from PostgREST proves the route exists; 200 and 401 are
      // both fine. A proxy's plain-text refusal is not, and lands in catch or
      // fails the content-type check below.
      const type = res.headers.get("content-type") ?? "";
      return res.status < 500 && (type.includes("json") || type.includes("openapi"));
    } catch {
      return false;
    }
  })();

  return cached;
}

/** Skip the current test, with a reason, when the project is unreachable. */
export async function requireBackend(): Promise<void> {
  const ok = await backendReachable();
  test.skip(
    !ok,
    "Supabase project unreachable from this runner — data-tier assertion not executed. " +
      "Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and run where the host resolves."
  );
}
