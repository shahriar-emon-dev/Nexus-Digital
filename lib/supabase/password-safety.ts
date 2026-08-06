import { createHash } from "node:crypto";

/**
 * Leaked-password checking against HaveIBeenPwned.
 *
 * Supabase Auth does this natively, but only on the Pro plan — this project is
 * on Free, so the advisor warning it raises cannot be cleared by any toggle or
 * API call. The protection itself is not plan-locked, though: the Pwned
 * Passwords range API is public and free, so the check lives here instead.
 *
 * THE PASSWORD NEVER LEAVES THIS PROCESS. k-anonymity means we send only the
 * first five hex characters of its SHA-1 and receive every suffix sharing that
 * prefix — roughly 800 of them. The comparison happens locally. HIBP learns a
 * prefix matching hundreds of millions of passwords and nothing else.
 *
 * This module must never reach the browser. The `node:crypto` import already
 * makes that a build error rather than a silent leak — a client component
 * importing this fails to compile — and the guard below states the rule
 * explicitly rather than leaving it as a side effect of an import. The
 * canonical `server-only` package would do the same job, but it is not a
 * dependency of this project and this needs none.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "password-safety.ts ran in a browser. It handles plaintext passwords and is server-only."
  );
}

const RANGE_ENDPOINT = "https://api.pwnedpasswords.com/range";

/** Beyond this many appearances a password is common enough to reject outright. */
const BREACH_THRESHOLD = 1;

export type PasswordCheck =
  | { safe: true }
  | { safe: false; occurrences: number }
  /** The service was unreachable. See the fail-open note in `assertNotLeaked`. */
  | { safe: true; unchecked: true };

export async function checkPasswordAgainstBreaches(password: string): Promise<PasswordCheck> {
  // SHA-1 is correct here and not a security choice: it is the hash HIBP's
  // corpus is indexed by. Nothing is stored or compared for authentication.
  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`${RANGE_ENDPOINT}/${prefix}`, {
      headers: {
        // Pads the response with random entries so its SIZE does not narrow
        // down which prefix was requested.
        "Add-Padding": "true",
        "User-Agent": "nexus-command-center",
      },
      // The whole point is a live answer; a cached one could clear a password
      // that was breached this morning.
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return { safe: true, unchecked: true };

    const body = await response.text();
    for (const line of body.split("\n")) {
      const [candidate, countRaw] = line.trim().split(":");
      if (candidate === suffix) {
        const occurrences = Number(countRaw);
        // Padding entries come back with a count of 0 and must be ignored,
        // or every password would look breached.
        if (occurrences >= BREACH_THRESHOLD) return { safe: false, occurrences };
      }
    }

    return { safe: true };
  } catch {
    return { safe: true, unchecked: true };
  }
}

/**
 * Returns an error message if the password is known to be breached.
 *
 * FAILS OPEN. If HIBP is unreachable the password is accepted, because the
 * alternative is that a third-party outage blocks every signup and password
 * reset on this site. The other rules — length, and Supabase's own strength
 * requirements — still apply, so an outage degrades the check rather than
 * removing all protection.
 */
export async function assertNotLeaked(password: string): Promise<string | null> {
  const result = await checkPasswordAgainstBreaches(password);
  if (result.safe) return null;

  return (
    `That password has appeared in ${result.occurrences.toLocaleString()} known data ` +
    "breaches, so it is one attackers try first. Please choose a different one — " +
    "a long passphrase of unrelated words works well."
  );
}
