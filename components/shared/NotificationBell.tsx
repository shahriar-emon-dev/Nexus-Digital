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
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/supabase/notification-actions";
import { useRealtime } from "@/lib/supabase/use-realtime";
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

/** Maps the database `kind` text onto the four icon buckets this bell knows. */
function toKind(kind: string): NotificationKind {
  const k = kind.toLowerCase();
  if (k.includes("message") || k.includes("reply") || k.includes("ticket")) return "message";
  if (k.includes("invoice") || k.includes("payment") || k.includes("billing")) return "invoice";
  if (k.includes("member") || k.includes("assign") || k.includes("staff")) return "member";
  return "project";
}

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(iso)
  );
};

/**
 * The notification bell, which now actually shows notifications.
 *
 * It previously took a `notifications` prop that defaulted to an empty array —
 * and `DashboardHeader`, which renders it on all 31 portal screens, defaulted
 * that prop to a shared empty constant and never received one from any caller.
 * `AdminCommandBar` rendered `<NotificationBell />` with no props at all. So
 * every bell in the product was permanently empty, while four database triggers
 * dutifully wrote rows into `public.notifications` that nobody could see.
 *
 * Threading a prop down through 31 call sites would have been 31 chances to
 * miss one. Instead the component loads its own inbox and subscribes to its own
 * table, so it is correct everywhere it is mounted and cannot silently regress
 * to empty. `notifications` is still accepted as an override for tests and
 * stories, and suppresses the fetch when supplied.
 */
export function NotificationBell({
  notifications: initial,
  className,
}: {
  notifications?: Notification[];
  className?: string;
}) {
  const [items, setItems] = React.useState<Notification[]>(initial ?? []);
  const controlled = initial !== undefined;

  const load = React.useCallback(async () => {
    if (controlled) return;
    const rows = await listNotifications(20);
    setItems(
      rows.map((n) => ({
        id: n.id,
        kind: toKind(n.kind),
        title: n.title,
        body: n.body ?? undefined,
        time: relative(n.created_at),
        read: n.read_at !== null,
        href: n.href ?? undefined,
      }))
    );
  }, [controlled]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // The table is in the realtime publication and the triggers write to it, so
  // a new notification arrives without the recipient navigating anywhere.
  useRealtime("shared:notifications", [{ table: "notifications" }], () => {
    void load();
  });

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
              onClick={() => {
                // Optimistic, then persisted. Marking read only in local state
                // meant the badge came straight back on the next navigation.
                setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                void markAllNotificationsRead();
              }}
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
                      onClick={() => {
                        setItems((prev) =>
                          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                        );
                        if (!n.read) void markNotificationRead(n.id);
                      }}
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
