import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";

import { AuthShell, BrandMark } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Client Registration",
  description:
    "Create your Nexus client portal account and initialize your workspace.",
};

const trustMarkers = [
  { icon: Lock, label: "256-bit SSL Encryption" },
  { icon: ShieldCheck, label: "SOC2 Type II Compliant" },
];

export default function RegisterPage() {
  return (
    <AuthShell
      brand={
        <>
          <BrandMark />

          <div className="relative z-10 max-w-md">
            <h1 className="mb-6 font-heading text-[3rem] leading-tight font-bold text-balance text-ink">
              Secure your digital future with NEXUS.
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-ink-secondary">
              Join the elite network of developers and agencies leveraging our
              high-performance authentication suite for mission-critical applications.
            </p>

            <ul className="flex flex-col gap-4">
              {trustMarkers.map((marker) => (
                <li
                  key={marker.label}
                  className="glass flex w-fit items-center gap-3 rounded-lg px-4 py-3"
                >
                  <marker.icon className="size-5 shrink-0 text-brand" aria-hidden />
                  <span className="text-[0.8125rem] font-semibold tracking-widest text-ink uppercase">
                    {marker.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-[0.8125rem] tracking-wide text-ink-tertiary uppercase">
            © {new Date().getFullYear()} Nexus Digital Agency. All rights reserved.
          </p>
        </>
      }
    >
      <Card variant="glass" className="rounded-xl p-8 md:p-10">
        <div className="mb-10">
          <h2 className="mb-2 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
            Create Your Client Portal Account
          </h2>
          <p className="text-ink-tertiary">Enter your details to initialize your workspace.</p>
        </div>

        <RegisterForm />
      </Card>

      <div className="mt-8 flex items-center justify-center gap-4">
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="text-[0.625rem] font-semibold tracking-[0.2em] text-ink-tertiary uppercase">
          Enterprise Ready
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
    </AuthShell>
  );
}
