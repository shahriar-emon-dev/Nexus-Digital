"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertNotLeaked } from "./password-safety";
import { authErrorMessage } from "./auth-errors";
import { createClient } from "./server";
import type { Portal } from "./types";

/**
 * Server Actions for the authentication flow.
 *
 * These run on the server so the browser never holds a code path that decides
 * whether a credential was valid — the previous implementation resolved a
 * setTimeout and redirected unconditionally, which meant any input signed in.
 */

export type AuthResult = { error: string } | { ok: true; redirectTo: string };

const homeFor: Record<Portal, string> = {
  ADMIN: "/admin",
  STAFF: "/staff",
  CLIENT: "/client",
};

/** Only allow same-origin relative paths, so `?next=` cannot become an open redirect. */
function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next") as string | null);

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns the same message for unknown email and wrong password,
    // which is correct — distinguishing them enumerates accounts. That wording
    // is passed through; only transport failures get rewritten, so an outage
    // does not reach the visitor as a JSON parse error.
    return { error: authErrorMessage(error) };
  }

  // A TOTP factor that is verified but not yet satisfied this session leaves
  // the assurance level at aal1; the second factor is genuinely required.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    return { ok: true, redirectTo: `/auth/verify-2fa${next ? `?next=${encodeURIComponent(next)}` : ""}` };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("portal, is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile) return { error: "Your account has no profile. Contact an administrator." };
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated." };
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: next ?? homeFor[profile.portal] };
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) return { error: "Enter your email and password." };
  if (password.length < 12) return { error: "Use at least 12 characters." };

  // Supabase Auth checks this natively only on the Pro plan, and this project
  // is on Free — so the check runs here. Only a SHA-1 prefix leaves the
  // server; see password-safety.ts.
  const leaked = await assertNotLeaked(password);
  if (leaked) return { error: leaked };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Portal and role are NOT passed here. The signup payload is
      // attacker-controlled; the database trigger assigns CLIENT regardless.
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login`,
    },
  });

  if (error) return { error: authErrorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: "/auth/login?registered=1" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) return { error: authErrorMessage(error) };
  // Deliberately identical whether or not the address exists.
  return { ok: true, redirectTo: "/auth/forgot-password?sent=1" };
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 12) return { error: "Use at least 12 characters." };

  // A reset is the moment someone is most likely to reach for a password they
  // already use elsewhere, which is exactly what a breach corpus catches.
  const leaked = await assertNotLeaked(password);
  if (leaked) return { error: leaked };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error) };

  return { ok: true, redirectTo: "/auth/login?reset=1" };
}

/** Verifies a TOTP code against the enrolled factor. Never compares codes in the browser. */
export async function verifyTotp(formData: FormData): Promise<AuthResult> {
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const next = safeNext(formData.get("next") as string | null);

  if (code.length !== 6) return { error: "Enter the six-digit code." };

  const supabase = await createClient();

  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { error: authErrorMessage(listError) };

  const factor = factors?.totp?.[0];
  if (!factor) return { error: "No authenticator is enrolled on this account." };

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError) return { error: authErrorMessage(challengeError) };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) return { error: "That code is not valid. Try the current one." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("portal")
    .eq("id", user!.id)
    .single();

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: next ?? homeFor[profile?.portal ?? "CLIENT"] };
}
