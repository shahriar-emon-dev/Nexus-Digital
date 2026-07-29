"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  FileText,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "./EmptyState";

export type NotificationKind = "message" | "invoice" | "project" | "member";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  time: string;
  read?: boolean;
  href?: string;
};

const kindMeta: Record<NotificationKind, { Icon: LucideIcon; cls: string }> = {
  message: { Icon: MessageSquare, cls: "bg-info-subtle text-info" },
  invoice: { Icon: CircleDollarSign, cls: "bg-warning-subtle text-warning" },
  project: { Icon: FileText, cls: "bg-brand-subtle text-brand-subtle-fg" },
  member: { Icon: UserPlus, cls: "bg-ion-subtle text-ion-subtle-fg" },
};

export function NotificationBell({
  notifications: initial = [],
  className,
}: {
  notifications?: Notification[];
  className?: string;
}) {
  const [items, setItems] = React.useState(initial);
  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("relative", className)}
            aria-label={
              unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread"
            }
          >
            <Bell />
            {unread > 0 && (
              <span
                aria-hidden
                data-tabular
                className={cn(
                  "absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1",
                  "bg-danger text-[0.625rem] leading-4 font-semibold text-canvas",
                  "ring-2 ring-surface"
                )}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between gap-2 border-b border-line-subtle px-4 py-3">
          <h3 className="font-heading text-sm font-semibold text-ink">Notifications</h3>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
            >
              <CheckCheck />
              Mark all read
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            compact
            icon={Bell}
            title="You're all caught up"
            description="New activity on your projects will show up here."
            className="rounded-none border-0 bg-transparent"
          />
        ) : (
          <ScrollArea className="max-h-88">
            <ul className="divide-y divide-line-subtle">
              {items.map((n) => {
                const { Icon, cls } = kindMeta[n.kind];
                return (
                  <li key={n.id}>
                    <a
                      href={n.href ?? "#"}
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                        )
                      }
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors duration-(--duration-instant)",
                        "hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-none",
                        !n.read && "bg-brand-subtle/35"
                      )}
                    >
                      <span
                        className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", cls)}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-start gap-2">
                          <span className="flex-1 text-[0.8125rem] leading-snug font-medium text-ink">
                            {n.title}
                          </span>
                          {!n.read && (
                            <>
                              <span
                                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                                aria-hidden
                              />
                              <span className="sr-only">Unread</span>
                            </>
                          )}
                        </span>
                        {n.body && (
                          <span className="line-clamp-2 text-xs leading-relaxed text-ink-tertiary">
                            {n.body}
                          </span>
                        )}
                        <span className="text-[0.6875rem] text-ink-tertiary">{n.time}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
