import type { Metadata } from "next";
import { Suspense } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

import { AuthShell, BrandMark } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a link to set a new password for your Nexus account.",
};

/**
 * This route was a placeholder while `requestPasswordReset` sat in
 * auth-actions.ts with no caller, and the sign-in form linked straight to it —
 * so anyone who forgot their password had no way back into their account.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      brand={
        <>
          <BrandMark
            sub={
              <>
                <span className="h-6 w-px bg-line-strong" aria-hidden />
                <span className="glass flex items-center gap-2 rounded-full px-3 py-1">
                  <ShieldCheck className="size-4 text-ion" aria-hidden />
                  <span className="text-[0.625rem] font-semibold tracking-widest text-ink-secondary uppercase">
                    Account recovery
                  </span>
                </span>
              </>
            }
          />

          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="font-heading text-[2rem] leading-tight font-bold text-balance text-ink">
              Locked out? Let&apos;s fix that.
            </h2>
            <p className="max-w-sm text-ink-secondary">
              We&apos;ll email a single-use link that lets you set a new password. Your current
              password keeps working until you do.
            </p>
          </div>

          <p className="relative z-10 max-w-xs text-ink-tertiary">
            Links expire after one hour and can only be used once.
          </p>
        </>
      }
    >
      <div className="relative">
        <span className="bloom -top-24 -right-24 size-64 bg-brand/20 blur-[100px]" aria-hidden />
        <span className="bloom -bottom-24 -left-24 size-64 bg-ion/10 blur-[100px]" aria-hidden />

        <Card variant="glass" className="relative z-10 gap-8 rounded-xl p-8 md:p-10">
          <div className="flex flex-col gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-subtle text-brand">
              <KeyRound className="size-6" aria-hidden />
            </span>
            <h1 className="font-heading text-[1.75rem] leading-tight font-bold tracking-tight text-ink">
              Reset your password
            </h1>
            <p className="text-ink-tertiary">
              Enter the address you sign in with.
            </p>
          </div>

          {/* Suspense because the form reads `?sent=1` from the query string. */}
          <Suspense fallback={null}>
            <ForgotPasswordForm />
          </Suspense>
        </Card>
      </div>
    </AuthShell>
  );
}
