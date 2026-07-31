import Link from "next/link";
import { Compass, FileQuestion, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * The app-wide 404. Reached from `notFound()` in the public dynamic routes and
 * from any unmatched URL. It offers two ways out, so a wrong link is never a
 * dead end.
 */
export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-5 py-16">
      <div className="w-full max-w-lg">
        <p className="mb-4 text-center font-mono text-[0.8125rem] tracking-[0.2em] text-ink-tertiary uppercase">
          Error 404
        </p>
        <EmptyState
          titleAs="h1"
          icon={FileQuestion}
          title="We couldn't find that page"
          description="The link may be out of date, or the page may have been moved. Nothing is broken on your end."
          action={
            <Button size="sm" render={<Link href="/" />}>
              <Compass />
              Back to the homepage
            </Button>
          }
          secondaryAction={
            <Button variant="outline" size="sm" render={<Link href="/contact" />}>
              <LifeBuoy />
              Contact us
            </Button>
          }
        />
      </div>
    </main>
  );
}
