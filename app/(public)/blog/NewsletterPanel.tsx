"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Newsletter signup.
 *
 * The source's form was `onsubmit="… alert('Subscribed!')"` — no validation and
 * a browser alert. This validates, reports errors inline against the field, and
 * confirms in place.
 */
export function NewsletterPanel() {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "invalid" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST to a real list. Nothing leaves the browser today.
    setState(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) ? "done" : "invalid");
  };

  return (
    <section className="mx-auto my-20 max-w-7xl px-4 md:px-10">
      <Card
        variant="glass"
        className="relative items-center overflow-hidden rounded-[3rem] p-12 text-center md:p-20"
      >
        <span
          className="bloom -bottom-20 -left-20 size-100 bg-ion/10 blur-[100px]"
          aria-hidden
        />

        <div className="relative">
          <h2 className="mb-6 font-heading text-[2.5rem] leading-[1.2] font-bold text-balance text-ink md:text-[3rem]">
            Stay at the Edge of Tech
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-ink-secondary">
            Join 12,000+ tech leaders receiving our weekly decode of digital transformation and
            architectural excellence.
          </p>

          {state === "done" ? (
            <p
              role="status"
              className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-full border border-success-line bg-success-subtle px-8 py-4 text-ink-secondary"
            >
              <Check className="size-5 shrink-0 text-success" aria-hidden />
              You&rsquo;re subscribed — look out for the next decode.
            </p>
          ) : (
            <form
              onSubmit={submit}
              noValidate
              className="mx-auto flex max-w-xl flex-col gap-4 md:flex-row"
            >
              <div className="flex-1 text-left">
                <label htmlFor="insights-email" className="sr-only">
                  Business email
                </label>
                <Input
                  id="insights-email"
                  type="email"
                  inputMode="email"
                  placeholder="Enter your business email"
                  className={cn("h-14 rounded-full px-8")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state === "invalid") setState("idle");
                  }}
                  aria-invalid={state === "invalid"}
                  aria-describedby={state === "invalid" ? "insights-email-error" : undefined}
                />
                {state === "invalid" && (
                  <p
                    id="insights-email-error"
                    className="mt-2 pl-8 text-xs font-medium text-danger"
                  >
                    Enter a valid email address.
                  </p>
                )}
              </div>
              <Button type="submit" size="xl" className="rounded-full px-10">
                Subscribe
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-ink-tertiary">
            No spam. Only high-signal technical insights. Unsubscribe anytime.
          </p>
        </div>
      </Card>
    </section>
  );
}
