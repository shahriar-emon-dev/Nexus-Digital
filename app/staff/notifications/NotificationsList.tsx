"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellOff, Check, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/lib/supabase/notification-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const kindTone: Record<string, "brand" | "ion" | "warning" | "default"> = {
  message: "brand",
  meeting: "ion",
  support: "warning",
  task: "default",
};

/**
 * The inbox. Notifications are written by database triggers, so this only ever
 * reads, marks read, and dismisses — there is no "create" path from a browser
 * by design.
 */
export function NotificationsList({ items }: { items: NotificationRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  useRealtime("staff:notifications", [{ table: "notifications" }], () => router.refresh());

  const unread = items.filter((n) => !n.read_at).length;

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  if (items.length === 0) {
    return (
      <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
        <BellOff className="size-8 text-ink-tertiary" aria-hidden />
        <h2 className="font-heading text-xl font-semibold text-ink">Nothing here yet</h2>
        <p className="max-w-sm text-ink-tertiary">
          You will be notified when someone messages you, assigns you a task, invites you to a
          meeting, or replies to a ticket you are handling.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.875rem] text-ink-tertiary">
          <span data-tabular>{unread}</span> unread of <span data-tabular>{items.length}</span>
        </p>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={() => run(markAllNotificationsRead)}
          >
            <Check />
            Mark all read
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((n) => (
          <li key={n.id}>
            <Card
              variant="glass"
              className={cn(
                "flex-row items-start gap-4 rounded-2xl p-4",
                !n.read_at && "border-brand/30 bg-brand/5"
              )}
            >
              <Badge variant={kindTone[n.kind] ?? "default"} size="sm" className="mt-0.5 capitalize">
                {n.kind}
              </Badge>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 line-clamp-2 text-[0.875rem] text-ink-tertiary">{n.body}</p>
                )}
                <p className="mt-1 flex items-center gap-3 text-[0.75rem] text-ink-tertiary">
                  <time dateTime={n.created_at} suppressHydrationWarning>
                    {new Date(n.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                  {n.href && (
                    <Link
                      href={n.href}
                      onClick={() => !n.read_at && run(() => markNotificationRead(n.id))}
                      className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none"
                    >
                      Open
                    </Link>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {!n.read_at && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Mark "${n.title}" as read`}
                    disabled={pending}
                    onClick={() => run(() => markNotificationRead(n.id))}
                  >
                    <Check />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Dismiss "${n.title}"`}
                  disabled={pending}
                  onClick={() => run(() => deleteNotification(n.id))}
                >
                  <Trash2 />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
