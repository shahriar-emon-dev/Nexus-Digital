"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { KNOWN_PROVIDERS } from "../derive";
import { createClient } from "./server";
import type { Database } from "./types";

/**
 * API credentials — the registry, never the secrets.
 *
 * The table has no column a secret could be written to, and nothing here
 * accepts one. What is stored is the provider's own visible prefix and the
 * final four characters, which is enough for a human to tell one key from
 * another and useless to anyone who steals the database.
 *
 * The original design pre-filled its edit drawer with `sk_live_51Mxx…` and put
 * a reveal button on every row. Both imply the server hands complete
 * production secrets back on request. It does not, and cannot.
 */

export type CredentialRow = Database["public"]["Tables"]["api_credentials"]["Row"];
export type CredentialEnvironment = Database["public"]["Enums"]["credential_environment"];

export type RotationState = "healthy" | "due-soon" | "overdue";

export type Credential = CredentialRow & {
  owner: { full_name: string; email: string } | null;
  /** Derived in the database from now(), never stored. */
  rotation: {
    dueAt: string;
    ageDays: number;
    daysRemaining: number;
    state: RotationState;
  };
};

type Result<T = void> = T extends void
  ? { ok: true } | { error: string }
  : { ok: true; data: T } | { error: string };

export async function listCredentials(): Promise<Credential[]> {
  noStore(); // rotation state is time-dependent; a cached read would go stale
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("api_credentials")
    .select("*, owner:profiles!api_credentials_owner_id_fkey ( full_name, email )")
    .order("provider")
    .order("name");

  const credentials = (rows ?? []) as unknown as Array<
    CredentialRow & { owner: { full_name: string; email: string } | null }
  >;
  if (credentials.length === 0) return [];

  // Second query rather than an embed: credential_rotation is a view, and
  // PostgREST resolves embeds through foreign key metadata a view does not
  // have. Asking for it inline fails the whole request.
  const { data: rot } = await supabase
    .from("credential_rotation")
    .select("credential_id, due_at, age_days, days_remaining, rotation_state")
    .in("credential_id", credentials.map((c) => c.id));

  const byId = new Map(
    (rot ?? []).map((r) => [
      r.credential_id as string,
      {
        dueAt: r.due_at as string,
        ageDays: (r.age_days as number) ?? 0,
        daysRemaining: (r.days_remaining as number) ?? 0,
        state: (r.rotation_state as RotationState) ?? "healthy",
      },
    ])
  );

  return credentials.map((c) => ({
    ...c,
    rotation: byId.get(c.id) ?? {
      dueAt: c.last_rotated_at,
      ageDays: 0,
      daysRemaining: c.rotation_interval_days,
      state: "healthy" as RotationState,
    },
  }));
}

/* ------------------------------------------------------------- mutations -- */

/**
 * Registers a key.
 *
 * The full secret is accepted only to derive its last four characters, and is
 * never written anywhere. It arrives in a Server Action body over TLS, is read
 * once, and goes out of scope — the alternative, asking the user to type the
 * last four by hand, invites a typo that makes the record useless.
 */
export async function createCredential(form: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in." };

  const provider = String(form.get("provider") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const secret = String(form.get("secret") ?? "").trim();
  const environment = String(form.get("environment") ?? "production") as CredentialEnvironment;
  const rotationDays = Number(form.get("rotationDays") ?? 90);

  if (provider.length < 2) return { error: "Choose or name a provider." };
  if (name.length < 2) return { error: "Give this key a name you will recognise later." };
  if (secret.length < 8) return { error: "That does not look like an API key." };
  if (!Number.isInteger(rotationDays) || rotationDays < 1 || rotationDays > 3650) {
    return { error: "Rotation interval must be between 1 and 3650 days." };
  }

  const known = KNOWN_PROVIDERS.find((p) => p.name.toLowerCase() === provider.toLowerCase());
  // Prefer the provider's documented prefix; otherwise take the key's own
  // leading run of non-alphanumeric-delimited characters, capped at 16.
  const prefix = known?.prefix ?? secret.slice(0, Math.min(8, secret.length - 4));

  const { error } = await supabase.from("api_credentials").insert({
    provider,
    name,
    environment,
    key_prefix: prefix.slice(0, 16),
    last4: secret.slice(-4),
    rotation_interval_days: rotationDays,
    notes: String(form.get("notes") ?? "").trim() || null,
    owner_id: auth.user.id,
    created_by: auth.user.id,
  });

  if (error) {
    return {
      error: error.code === "23505"
        ? "A key with that provider, name and environment already exists."
        : error.message,
    };
  }

  revalidatePath("/admin/keys");
  revalidatePath("/admin/settings");
  return { ok: true };
}

/**
 * Records a rotation.
 *
 * "Rotate" here means the key was replaced at the provider and the new one
 * registered — there is no way for this app to rotate a third-party key on the
 * user's behalf, and a button that implied otherwise would be a lie. Supplying
 * the new secret updates the last four so the record still identifies the key
 * actually in use.
 */
export async function rotateCredential(id: string, newSecret?: string): Promise<Result> {
  const supabase = await createClient();

  const patch: Database["public"]["Tables"]["api_credentials"]["Update"] = {
    last_rotated_at: new Date().toISOString(),
  };
  if (newSecret && newSecret.trim().length >= 8) {
    patch.last4 = newSecret.trim().slice(-4);
  }

  const { error } = await supabase.from("api_credentials").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/keys");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}

export async function updateCredential(id: string, form: FormData): Promise<Result> {
  const supabase = await createClient();
  const rotationDays = Number(form.get("rotationDays") ?? 90);
  if (!Number.isInteger(rotationDays) || rotationDays < 1 || rotationDays > 3650) {
    return { error: "Rotation interval must be between 1 and 3650 days." };
  }

  const { error } = await supabase
    .from("api_credentials")
    .update({
      name: String(form.get("name") ?? "").trim(),
      environment: String(form.get("environment") ?? "production") as CredentialEnvironment,
      rotation_interval_days: rotationDays,
      notes: String(form.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/keys");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setCredentialEnabled(id: string, enabled: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("api_credentials")
    .update({ is_enabled: enabled })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/keys");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function deleteCredential(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("api_credentials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/keys");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit-logs");
  return { ok: true };
}
