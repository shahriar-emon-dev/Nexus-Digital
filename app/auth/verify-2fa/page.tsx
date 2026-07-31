import type { Metadata } from "next";
import { Suspense } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";

import { AuthShell, BrandMark } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/card";
import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = {
  title: "Two-factor verification",
  description: "Confirm the second factor to finish signing in to Nexus.",
};

export default function VerifyTwoFactorPage() {
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
                    Step 2 of 2
                  </span>
                </span>
              </>
            }
          />

          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="font-heading text-[2rem] leading-tight font-bold text-balance text-ink">
              One more check before you&apos;re in.
            </h2>
            <p className="max-w-sm text-ink-secondary">
              Your password was accepted. A second factor keeps the account safe
              even if that password is ever exposed elsewhere.
            </p>
          </div>

          <p className="relative z-10 max-w-xs text-ink-tertiary">
            Codes rotate every 30 seconds and are verified server-side.
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
              <Fingerprint className="size-6" aria-hidden />
            </span>
            <h1 className="font-heading text-[1.75rem] leading-tight font-bold tracking-tight text-ink">
              Two-factor verification
            </h1>
            <p className="text-ink-tertiary">
              Confirm it&apos;s you to finish signing in.
            </p>
          </div>

          <Suspense fallback={null}>
            <VerifyForm destination="Authenticator app" />
          </Suspense>
        </Card>
      </div>
    </AuthShell>
  );
}
