import type { Metadata } from "next";
import Link from "next/link";
import { Info, ShieldCheck } from "lucide-react";

import { AuthShell, BrandMark } from "@/components/auth/AuthShell";
import { QuoteRotator } from "@/components/auth/QuoteRotator";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Secure Authentication",
  description: "Secure access to the Nexus client, staff and admin portals.",
};

export default function LoginPage() {
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
                    SOC2 Compliant Architecture
                  </span>
                </span>
              </>
            }
          />

          <QuoteRotator />

          <p className="relative z-10 max-w-xs text-ink-tertiary">
            Advanced encryption protocols active. Connection via AES-256 secure tunnel.
          </p>
        </>
      }
    >
      <div className="relative">
        <span className="bloom -top-24 -right-24 size-64 bg-brand/20 blur-[100px]" aria-hidden />
        <span className="bloom -bottom-24 -left-24 size-64 bg-ion/10 blur-[100px]" aria-hidden />

        <Card variant="glass" className="relative z-10 rounded-xl p-10">
          <div className="mb-10 text-center md:text-left">
            <h1 className="mb-2 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
              Welcome Back to Nexus Portal
            </h1>
            <p className="text-ink-tertiary">Secure access for the digital vanguard.</p>
          </div>

          <LoginForm />

          {/* /auth/register had nothing linking to it anywhere in the app —
              the only way in was typing the URL. */}
          <p className="mt-8 text-center text-[0.8125rem] text-ink-tertiary">
            Don&apos;t have an account?
            <Link
              href="/auth/register"
              className="ml-2 font-semibold text-brand hover:underline"
            >
              Request Access
            </Link>
          </p>
        </Card>

        <p className="mt-8 flex justify-center px-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/50 px-4 py-2">
            <Info className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="text-xs leading-none text-ink-tertiary">
              System automatically routes to Client, Staff, or Admin portal based on
              credentials.
            </span>
          </span>
        </p>
      </div>
    </AuthShell>
  );
}
