"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";

/**
 * Two-factor enrolment.
 *
 * `auth-actions.ts` has always been able to *verify* a TOTP code — `signIn`
 * checks the assurance level and routes to /auth/verify-2fa, and `verifyTotp`
 * challenges the enrolled factor correctly. What did not exist anywhere in the
 * codebase was a call to `mfa.enroll`, which meant no account could ever have a
 * factor to verify. The whole second-factor path was unreachable: spec §15.1
 * asks for "2FA available to all users", and `lib/access-control.ts` even
 * models a `totpEnrolled` count and a `TotpEnforcement` type for a feature
 * nobody could switch on.
 *
 * Enrolment is a three-step handshake and it matters that it stays that way:
 * `enroll` returns a QR code and a factor in `unverified` state, and the factor
 * only becomes usable once the user proves they can read it. Skipping the
 * verify step would lock people out of their own accounts the moment the policy
 * required a second factor.
 */

export type EnrolResult =
  | { error: string }
  | { ok: true; factorId: string; qrCode: string; secret: string; uri: string };

type Result = { ok: true } | { error: string };

export type FactorSummary = {
  id: string;
  friendlyName: string | null;
  status: string;
  createdAt: string;
};

/** Factors on the signed-in account, verified or not. */
export async function listFactors(): Promise<FactorSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return [];

  return (data.all ?? []).map((f) => ({
    id: f.id,
    friendlyName: f.friendly_name ?? null,
    status: f.status,
    createdAt: f.created_at,
  }));
}

/**
 * Begins enrolment and returns the QR payload.
 *
 * A stale unverified factor from an abandoned attempt is cleared first.
 * Supabase rejects a second enrolment under the same friendly name, so without
 * this a user who closed the dialog once could never enrol again — which reads
 * as "2FA is broken" rather than "finish the previous attempt".
 */
export async function startTotpEnrolment(friendlyName = "Authenticator"): Promise<EnrolResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase.auth.mfa.listFactors();
  const stale = (existing?.all ?? []).filter((f) => f.status === "unverified");
  for (const factor of stale) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  if ((existing?.totp ?? []).some((f) => f.status === "verified")) {
    return { error: "An authenticator is already enrolled on this account." };
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });
  if (error || !data) return { error: error?.message ?? "Could not start enrolment." };

  return {
    ok: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    // Shown as a fallback for authenticator apps that cannot scan.
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/** Completes enrolment by proving the code can be read. */
export async function confirmTotpEnrolment(factorId: string, code: string): Promise<Result> {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 6) return { error: "Enter the six-digit code." };

  const supabase = await createClient();

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError || !challenge) {
    return { error: challengeError?.message ?? "Could not start the challenge." };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: digits,
  });
  if (error) return { error: "That code is not valid. Try the current one." };

  revalidatePath("/client/settings");
  revalidatePath("/staff/settings");
  revalidatePath("/admin/settings");
  return { ok: true };
}

/**
 * Removes a factor.
 *
 * Supabase requires the session to already be at aal2 to unenrol a verified
 * factor, which is the correct behaviour — somebody who has walked away from an
 * unlocked laptop should not be able to strip the second factor off the
 * account with one click.
 */
export async function unenrolFactor(factorId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) {
    return {
      error: error.message.toLowerCase().includes("aal2")
        ? "Sign in again with your authenticator before removing it."
        : error.message,
    };
  }

  revalidatePath("/client/settings");
  revalidatePath("/staff/settings");
  revalidatePath("/admin/settings");
  return { ok: true };
}
