"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AtSign, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/lib/supabase/auth-actions";

type Errors = Partial<Record<"email" | "password", string>>;
type Status = "idle" | "verifying" | "granted";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [formError, setFormError] = React.useState<string | null>(
    params.get("error") === "account-disabled"
      ? "This account has been deactivated. Contact an administrator."
      : null
  );
  const [values, setValues] = React.useState({ email: "", password: "" });
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<Status>("idle");
  const [reveal, setReveal] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(values.email))
      found.email = "Enter a valid email address.";
    if (!values.password) found.password = "Enter your password.";
    setErrors(found);

    if (Object.keys(found).length) {
      const first = (["email", "password"] as const).find((k) => found[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("verifying");
    setFormError(null);

    // The credential is checked on the server. The previous implementation
    // resolved a timer and redirected unconditionally, so any input signed in.
    const payload = new FormData();
    payload.set("email", values.email);
    payload.set("password", values.password);
    if (next) payload.set("next", next);

    const result = await signIn(payload);

    if ("error" in result) {
      setStatus("idle");
      setFormError(result.error);
      document.getElementById("email")?.focus();
      return;
    }

    setStatus("granted");
    router.push(result.redirectTo);
    router.refresh();
  };

  const busy = status !== "idle";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {formError && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Professional Email</Label>
        <div className="relative">
          <AtSign
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@nexus-digital.com"
            className="h-13 pl-12"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={(e) => {
              setValues((v) => ({ ...v, email: e.target.value }));
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-xs font-medium text-danger">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Access Credential</Label>
          <Link
            href="/auth/forgot-password"
            className="text-[0.8125rem] font-medium text-brand transition-colors hover:text-ion"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <KeyRound
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            id="password"
            name="password"
            type={reveal ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="h-13 pr-12 pl-12"
            value={values.password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            onChange={(e) => {
              setValues((v) => ({ ...v, password: e.target.value }));
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            aria-pressed={reveal}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-sm text-ink-tertiary transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs font-medium text-danger">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="xl"
        disabled={busy}
        className={cn("w-full", status === "granted" && "bg-success text-canvas disabled:opacity-100")}
      >
        {status === "idle" && (
          <>
            Log In
            <ArrowRight />
          </>
        )}
        {status === "verifying" && (
          <>
            <Loader2 className="animate-spin motion-reduce:animate-none" />
            Verifying…
          </>
        )}
        {status === "granted" && (
          <>
            <CheckCircle2 />
            Access granted
          </>
        )}
      </Button>

      <p aria-live="polite" className="sr-only">
        {status === "verifying" && "Verifying your credentials."}
        {status === "granted" && "Credentials accepted. Continuing to two-factor verification."}
      </p>

      {/* A divider reading "Or enterprise SSO" and a "Continue with Google"
          button used to sit here. Neither did anything: `signInWithOAuth`
          appears nowhere in this codebase and no OAuth provider is configured
          on the Supabase project, so the button was type="button" with no
          handler. A dead authentication affordance is worse than its absence —
          it teaches people the sign-in page is broken. Restore this block
          together with a configured provider, not before. */}
    </form>
  );
}

