import Link from "next/link";
import { Compass, Hammer, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";

/**
 * Which surface the unbuilt route sits on, derived from the route itself.
 *
 * Previously every scaffold offered "Back to the site" → `/`, which drops an
 * admin out of the admin shell entirely and loses the sidebar. The way back has
 * to stay inside the portal the user was already in.
 */
function surfaceFor(route: string): { label: string; href: string } {
  if (route.startsWith("/admin")) return { label: "Command Center", href: "/admin" };
  if (route.startsWith("/client")) return { label: "the client portal", href: "/client" };
  if (route.startsWith("/staff")) return { label: "the staff workspace", href: "/staff" };
  if (route.startsWith("/auth")) return { label: "sign in", href: "/auth/login" };
  return { label: "the site", href: "/" };
}

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
  const surface = surfaceFor(route);
  const isPortal = surface.href !== "/";

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 lg:px-8">
      <EmptyState
        titleAs="h1"
        icon={Hammer}
        title={title}
        description={
          description ??
          "This route is wired into the app and inherits the design system, but its screen has not been built yet."
        }
        action={
          <Button variant="outline" size="sm" render={<Link href={surface.href} />}>
            {isPortal ? <Undo2 /> : <Compass />}
            {isPortal ? `Back to ${surface.label}` : "Back to the site"}
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
