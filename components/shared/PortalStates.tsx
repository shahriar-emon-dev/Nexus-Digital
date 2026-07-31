"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Error and loading states for the three role-gated portals.
 *
 * These render *inside* each portal layout, so the sidebar and command bar stay
 * put — a failed panel must not take the navigation down with it, otherwise the
 * only way out is the browser's back button.
 */

export function PortalError({
  error,
  reset,
  portalLabel,
  portalHref,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  portalLabel: string;
  portalHref: string;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16 lg:px-8">
      <EmptyState
        titleAs="h1"
        icon={TriangleAlert}
        title="This screen failed to load"
        description={`Your session is fine and the rest of ${portalLabel} is still available. Retry, or head back to the overview.`}
        action={
          <Button size="sm" onClick={reset}>
            <RotateCcw />
            Retry
          </Button>
        }
        secondaryAction={
          <Button variant="outline" size="sm" render={<Link href={portalHref} />}>
            <Undo2 />
            {portalLabel} overview
          </Button>
        }
      />
      {error.digest && (
        <p className="mt-4 text-center text-xs text-ink-tertiary">
          Reference <code className="font-mono text-ink-secondary">{error.digest}</code>
        </p>
      )}
    </div>
  );
}

/**
 * Route-level loading skeleton. Shaped like the dashboards it stands in for —
 * a header, a KPI row and two panels — so the swap to real content does not
 * shift layout.
 */
export function PortalLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10" aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-10 w-[min(24rem,80%)]" />
        <Skeleton className="h-4 w-[min(32rem,90%)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
