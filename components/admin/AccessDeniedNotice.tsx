"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Shown when the middleware bounced the user off a route their role cannot
 * reach. Without it the redirect was silent and read as a broken link.
 *
 * This reads the query string on the client on purpose: taking `searchParams`
 * in the page would opt `/admin` out of static rendering and make the whole
 * dashboard render per request.
 */
function Notice() {
  const denied = useSearchParams().get("denied");
  if (!denied) return null;

  return (
    <Alert tone="warning" role="alert">
      <AlertTitle>You don&apos;t have access to that screen</AlertTitle>
      <AlertDescription>
        <code className="font-mono">{denied}</code> requires a higher grant than
        your role holds. A Global Admin can adjust it under Access Control —{" "}
        {/* Deliberately NOT a link to /admin/access-control: that route is
            itself gated, so a user who just got bounced would be bounced again
            and land back on this same banner. Support is reachable by every
            role. */}
        <Link
          href="/admin/support"
          className="font-medium text-brand underline underline-offset-2"
        >
          request access
        </Link>{" "}
        if you need it.
      </AlertDescription>
    </Alert>
  );
}

export function AccessDeniedNotice() {
  return (
    <Suspense fallback={null}>
      <Notice />
    </Suspense>
  );
}
