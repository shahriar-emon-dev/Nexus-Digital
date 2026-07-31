"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * App-wide error boundary. Without this, a throw anywhere in a route segment
 * surfaced Next's default overlay in dev and a blank document in production.
 *
 * `digest` is the only server detail safe to show — it is the key that ties the
 * screen the user is looking at to the entry in the server log.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Replaced by the telemetry sink once one is configured.
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-5 py-16">
      <div className="w-full max-w-lg">
        <p className="mb-4 text-center font-mono text-[0.8125rem] tracking-[0.2em] text-ink-tertiary uppercase">
          Unexpected error
        </p>
        <EmptyState
          titleAs="h1"
          icon={TriangleAlert}
          title="Something went wrong on this page"
          description="The rest of the app is unaffected. Try again — if it keeps happening, send us the reference below."
          action={
            <Button size="sm" onClick={reset}>
              <RotateCcw />
              Try again
            </Button>
          }
          secondaryAction={
            <Button variant="outline" size="sm" render={<Link href="/" />}>
              <Compass />
              Back to the homepage
            </Button>
          }
        />
        {error.digest && (
          <p className="mt-4 text-center text-xs text-ink-tertiary">
            Reference <code className="font-mono text-ink-secondary">{error.digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}
