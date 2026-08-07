import type { Metadata } from "next";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { AuthShell, BrandMark } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Nexus account.",
};

/**
 * The destination of the recovery email. It was a placeholder, so the link a
 * user received landed on a dead page even when the email itself worked.
 */
export default function ResetPasswordPage() {
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
              Choose something new.
            </h2>
            <p className="max-w-sm text-ink-secondary">
              Twelve characters minimum. We check it against known breach corpora before
              accepting it, so a password you use elsewhere may be refused.
            </p>
          </div>

          <p className="relative z-10 max-w-xs text-ink-tertiary">
            Only a hash prefix of your password ever leaves this device.
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
              <LockKeyhole className="size-6" aria-hidden />
            </span>
            <h1 className="font-heading text-[1.75rem] leading-tight font-bold tracking-tight text-ink">
              Set a new password
            </h1>
          </div>

          <ResetPasswordForm />
        </Card>
      </div>
    </AuthShell>
  );
}
