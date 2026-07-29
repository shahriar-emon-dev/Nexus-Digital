import Link from "next/link";
import { Compass, Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";

/**
 * Placeholder for routes that exist in the information architecture but have no
 * screen yet. It is deliberately built out of the real design system so an
 * unbuilt route still looks like part of the product — and so it is obvious at a
 * glance which screens are still outstanding.
 */
export function RouteScaffold({
  title,
  route,
  description,
}: {
  title: string;
  route: string;
  description?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 lg:px-8">
      <EmptyState
        icon={Hammer}
        title={title}
        description={
          description ??
          "This route is wired into the app and inherits the design system, but its screen has not been built yet."
        }
        action={
          <Button variant="outline" size="sm" render={<Link href="/" />}>
            <Compass />
            Back to the site
          </Button>
        }
        secondaryAction={
          <Badge variant="outline" className="font-mono">
            {route}
          </Badge>
        }
      />
    </div>
  );
}
