"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

import { requestPasswordReset } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Requests a reset link.
 *
 * The success panel is deliberately identical whether or not the address has an
 * account — the server action is written that way too, and saying "no account
 * with that email" here would hand an attacker a membership oracle and undo it.
 */
export function ForgotPasswordForm() {
  const params = useSearchParams();
  const [sent, setSent] = React.useState(params.get("sent") === "1");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(form);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-brand/10">
          <MailCheck className="size-7 text-brand" aria-hidden />
        </span>
        <h2 className="font-heading text-xl font-semibold text-ink">Check your inbox</h2>
        <p className="max-w-sm text-[0.9375rem] text-ink-secondary">
          If that address has an account, a reset link is on its way. The link expires in one
          hour — request another if it does.
        </p>
        <Button variant="outline" className="mt-2 rounded-xl" render={<Link href="/auth/login" />}>
          <ArrowLeft />
          Back to sign in
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
        <label htmlFor="email" className="text-[0.875rem] font-medium text-ink">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="you@company.com"
        />
      </div>

      <Button type="submit" size="lg" className="rounded-xl" disabled={pending}>
        {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Send reset link
      </Button>

      <Link
        href="/auth/login"
        className="mx-auto w-fit rounded-sm text-[0.875rem] text-ink-tertiary underline-offset-4 hover:text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
      >
        Back to sign in
      </Link>
    </form>
  );
}
