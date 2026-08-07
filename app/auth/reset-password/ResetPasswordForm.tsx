"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updatePassword } from "@/lib/supabase/auth-actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

/**
 * Sets a new password from a recovery link.
 *
 * Supabase delivers the recovery token in the URL fragment and the browser
 * client exchanges it for a session. That exchange has to happen here rather
 * than on the server: a fragment never leaves the browser, so the server never
 * sees it. Until the session exists there is nothing to update, which is why
 * the form waits for `ready` instead of rendering straight away.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = React.useState<boolean | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const supabase = createClient();
    // The client picks the token out of the fragment on load; this asks whether
    // that produced a usable session.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Those two passwords do not match.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(form);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.push("/auth/login?reset=1");
    });
  }

  if (ready === null) {
    return (
      <p className="flex items-center gap-2 text-[0.9375rem] text-ink-tertiary">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        Checking your link…
      </p>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-danger-subtle px-3 py-2 text-[0.875rem] text-danger">
          This link has expired or has already been used. Request a new one to continue.
        </p>
        <Button className="rounded-xl" render={<Link href="/auth/forgot-password" />}>
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && (
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-[0.875rem] text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[0.875rem] font-medium text-ink">
          New password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength value={password} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-[0.875rem] font-medium text-ink">
          Confirm new password
        </label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="rounded-xl" disabled={pending}>
        {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Set new password
      </Button>
    </form>
  );
}
