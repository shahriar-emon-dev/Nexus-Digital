"use client";

import Link from "next/link";
import { MessageSquarePlus, Plus, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Keyed by name rather than taking the component itself: a Server Component
 * cannot pass a function across the client boundary, so an icon prop would
 * fail the route with "Functions cannot be passed directly to Client
 * Components". Adding a key here without a `FabIcon` entry is a type error.
 */
const icons = {
  plus: Plus,
  comment: MessageSquarePlus,
} satisfies Record<string, LucideIcon>;

export type FabIcon = keyof typeof icons;

/**
 * Contextual action button for the portal.
 *
 * The label is a real tooltip rather than the design's hover-only `<span>`, so
 * it is reachable by keyboard and announced as the control's description. The
 * button also carries an `aria-label`, because on a touch device the label
 * never appears at all.
 *
 * The action is per-surface — overview offers a new request, a project offers a
 * comment on that project — so it is a prop rather than a second component.
 */
export function ActionFab({
  label = "New Action Request",
  href = "/client/messages",
  icon = "plus",
}: {
  label?: string;
  href?: string;
  icon?: FabIcon;
} = {}) {
  const Icon = icons[icon];
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-lg"
            aria-label={label}
            className="fixed right-8 bottom-8 z-40 size-16 rounded-full shadow-e4 hover:scale-110"
            render={<Link href={href} />}
          >
            <Icon className="size-8" />
          </Button>
        }
      />
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
