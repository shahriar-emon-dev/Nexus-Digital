"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  confirmTotpEnrolment,
  startTotpEnrolment,
  unenrolFactor,
  type FactorSummary,
} from "@/lib/supabase/mfa-actions";

/**
 * Two-factor enrolment.
 *
 * The sign-in path could already *verify* a TOTP code and route to
 * /auth/verify-2fa when the assurance level demanded one — but `mfa.enroll` was
 * called nowhere in the codebase, so no account could ever have a factor to
 * verify. Spec §15.1 asks for 2FA available to all users; this is the missing
 * half, and it is mounted on all three portals' settings screens.
 *
 * The QR code returned by Supabase is an SVG data URI, so it renders directly
 * without a QR library. The raw secret is shown alongside it because a
 * meaningful share of people set this up on the same device they are reading it
 * on and cannot scan their own screen.
 */
export function TwoFactorPanel({ factors }: { factors: FactorSummary[] }) {
  const router = useRouter();
  const toast = useToast();

  const verified = factors.find((f) => f.status === "verified");

  const [enrolling, setEnrolling] = React.useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function begin() {
    setError(null);
    startTransition(async () => {
      const result = await startTotpEnrolment();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEnrolling({
        factorId: result.factorId,
        qrCode: result.qrCode,
        secret: result.secret,
      });
    });
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (!enrolling) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmTotpEnrolment(enrolling.factorId, code);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEnrolling(null);
      setCode("");
      toast.add({ title: "Two-factor authentication is on", type: "success" });
      router.refresh();
    });
  }

  function remove(factorId: string) {
    setError(null);
    startTransition(async () => {
      const result = await unenrolFactor(factorId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({ title: "Authenticator removed", type: "success" });
      router.refresh();
    });
  }

  return (
    <Card variant="glass" className="gap-5 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <ShieldCheck className="size-5 text-brand" aria-hidden />
            Two-factor authentication
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-tertiary">
            A code from your authenticator app is required in addition to your
            password. Verified in the database, never in the browser.
          </p>
        </div>
        {verified ? (
          <Badge variant="success">On</Badge>
        ) : (
          <Badge variant="outline">Off</Badge>
        )}
      </div>

      {error && (
        <Alert tone="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {verified ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-sunken px-4 py-3">
          <span className="flex items-center gap-2.5 text-sm text-ink-secondary">
            <Smartphone className="size-4 text-ink-tertiary" aria-hidden />
            {verified.friendlyName || "Authenticator"} · enrolled{" "}
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(verified.createdAt))}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => remove(verified.id)}
          >
            <ShieldOff />
            Remove
          </Button>
        </div>
      ) : enrolling ? (
        <form onSubmit={confirm} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Supabase returns an SVG data URI, so no QR library is needed. */}
            <img
              src={enrolling.qrCode}
              alt="QR code for your authenticator app"
              className="size-44 shrink-0 rounded-xl border border-line bg-white p-2"
            />
            <div className="flex min-w-0 flex-col gap-2 text-sm text-ink-secondary">
              <p>Scan this with your authenticator app, then enter the code it shows.</p>
              <p className="text-ink-tertiary">
                Cannot scan? Enter this key manually:
              </p>
              <code className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-xs break-all text-ink">
                {enrolling.secret}
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="totp-code" className="text-[0.8125rem] font-medium text-ink">
                Six-digit code
              </label>
              <Input
                id="totp-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-32 tracking-[0.3em]"
                data-tabular
              />
            </div>
            <Button type="submit" disabled={pending || code.replace(/\D/g, "").length !== 6}>
              {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
              Turn on
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setEnrolling(null);
                setCode("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <Button onClick={begin} disabled={pending}>
            {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Set up authenticator
          </Button>
        </div>
      )}
    </Card>
  );
}
