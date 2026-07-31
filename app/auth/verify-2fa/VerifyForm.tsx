"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Loader2, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";

const LENGTH = 6;
const RESEND_SECONDS = 30;

type Status = "idle" | "verifying" | "error";

/**
 * Second factor entry.
 *
 * Six inputs rather than one, because that is what authenticator UIs condition
 * people to expect — but they behave as a single field: paste fills all of
 * them, Backspace walks backwards, and arrow keys move between them. Only the
 * first is in the tab order; the rest are reached by typing, so a keyboard user
 * is not made to tab six times.
 */
export function VerifyForm({ destination }: { destination: string }) {
  const [digits, setDigits] = React.useState<string[]>(Array(LENGTH).fill(""));
  const [status, setStatus] = React.useState<Status>("idle");
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);
  const [useBackup, setUseBackup] = React.useState(false);
  const [backup, setBackup] = React.useState("");

  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown. Cleared on unmount so it cannot tick against a dead tree.
  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const code = digits.join("");
  const complete = useBackup ? backup.trim().length >= 8 : code.length === LENGTH;

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? "" : x)));
      return;
    }

    setDigits((d) => {
      const next = [...d];
      // A paste lands in one input but should fill the rest.
      for (let i = 0; i < clean.length && index + i < LENGTH; i += 1) {
        next[index + i] = clean[i];
      }
      return next;
    });

    const landed = Math.min(index + clean.length, LENGTH - 1);
    refs.current[landed]?.focus();
    if (status === "error") setStatus("idle");
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
      setDigits((d) => d.map((x, i) => (i === index - 1 ? "" : x)));
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setStatus("verifying");
    // TODO: verify against the TOTP secret server-side. Never compare codes in
    // the browser, and rate-limit attempts per session.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("error");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {!useBackup ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[0.8125rem] font-medium text-ink-secondary">
            Enter the six-digit code from your authenticator app.
          </legend>

          <div className="flex justify-between gap-2 sm:gap-3">
            {digits.map((digit, i) => (
              <Input
                key={i}
                ref={(el: HTMLInputElement | null) => {
                  refs.current[i] = el;
                }}
                value={digit}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                // Only the first input is a tab stop; typing advances the rest.
                tabIndex={i === 0 ? 0 : -1}
                aria-label={`Digit ${i + 1} of ${LENGTH}`}
                maxLength={LENGTH}
                className={cn(
                  "h-14 flex-1 px-0 text-center font-mono text-xl font-semibold sm:h-16 sm:text-2xl",
                  "transition-[border-color,box-shadow] duration-(--duration-normal)",
                  digit && "border-brand-line shadow-[0_0_16px_var(--brand-glow)]",
                  status === "error" && "border-danger"
                )}
              />
            ))}
          </div>

          <p className="text-[0.8125rem] text-ink-tertiary">
            Sent to <span className="text-ink-secondary">{destination}</span>
          </p>
        </fieldset>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="backup">Backup code</Label>
          <div className="relative">
            <KeyRound
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-tertiary"
              aria-hidden
            />
            <Input
              id="backup"
              value={backup}
              onChange={(e) => {
                setBackup(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              autoComplete="one-time-code"
              spellCheck={false}
              placeholder="xxxx-xxxx-xxxx"
              className="h-13 pl-12 font-mono"
            />
          </div>
          <p className="text-[0.8125rem] text-ink-tertiary">
            One of the codes you saved when two-factor was switched on. Each works
            once.
          </p>
        </div>
      )}

      {status === "error" && (
        <Alert tone="warning">
          <AlertTitle>Verification is not connected</AlertTitle>
          <AlertDescription>
            {/* TODO: POST to the verify endpoint. The code must be checked
                server-side against the stored secret, with attempt limiting. */}
            No authentication backend is wired up yet, so this code could not be
            checked and you have not been signed in.
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        size="xl"
        disabled={!complete || status === "verifying"}
        className="w-full shadow-[0_0_24px_var(--brand-glow)] transition-transform hover:scale-[1.01]"
      >
        {status === "verifying" ? (
          <>
            <Loader2 className="animate-spin motion-reduce:animate-none" />
            Verifying…
          </>
        ) : (
          <>
            Verify and continue
            <ArrowRight />
          </>
        )}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.8125rem]">
        <button
          type="button"
          onClick={() => {
            setUseBackup((v) => !v);
            setStatus("idle");
          }}
          className="rounded-sm font-medium text-brand transition-colors hover:text-ion focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        >
          {useBackup ? "Use authenticator code" : "Use a backup code instead"}
        </button>

        {/* Disabled while counting down, rather than firing a request per click. */}
        <button
          type="button"
          disabled={secondsLeft > 0}
          onClick={() => setSecondsLeft(RESEND_SECONDS)}
          className={cn(
            "rounded-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
            secondsLeft > 0
              ? "cursor-not-allowed text-ink-tertiary"
              : "text-brand hover:text-ion"
          )}
        >
          {secondsLeft > 0 ? (
            <>
              Resend in <span data-tabular>{secondsLeft}</span>s
            </>
          ) : (
            "Resend code"
          )}
        </button>
      </div>

      <p className="flex items-center justify-center gap-2 border-t border-line-subtle pt-6 text-[0.75rem] text-ink-tertiary">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
        Not you?{" "}
        <Link
          href="/auth/login"
          className="rounded-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        >
          Return to sign in
        </Link>
      </p>
    </form>
  );
}
