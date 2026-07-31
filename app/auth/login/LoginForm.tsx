"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AtSign, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";

type Errors = Partial<Record<"email" | "password", string>>;
type Status = "idle" | "verifying" | "granted";

export function LoginForm() {
  const router = useRouter();
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
    // TODO: hand off to NextAuth `signIn`. Nothing is authenticated today —
    // this only advances the flow so the second factor is reachable.
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("granted");
    router.push("/auth/verify-2fa");
  };

  const busy = status !== "idle";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
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

      <div className="flex items-center gap-4 py-2">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="text-[0.625rem] tracking-tight text-ink-tertiary uppercase">
          Or enterprise SSO
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>

      <Button type="button" variant="outline" size="xl" className="w-full">
        <GoogleMark />
        Continue with Google
      </Button>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        opacity="0.75"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        opacity="0.55"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="currentColor"
        opacity="0.35"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
