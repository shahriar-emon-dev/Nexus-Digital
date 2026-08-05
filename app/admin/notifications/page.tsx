import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BellOff,
  CircleDollarSign,
  FileText,
  KeyRound,
  MessageSquareQuote,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  listAttentionItems,
  type AttentionKind,
  type AttentionSeverity,
} from "@/lib/supabase/attention-queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

const kindIcon: Record<AttentionKind, LucideIcon> = {
  invoice: CircleDollarSign,
  review: MessageSquareQuote,
  credential: KeyRound,
  access: ShieldAlert,
  content: FileText,
};

const severityTone: Record<AttentionSeverity, "danger" | "warning" | "info"> = {
  critical: "danger",
  warning: "warning",
  info: "info",
};

/**
 * An attention feed computed from live rows, not a notifications table.
 *
 * Nothing in this system writes notifications, so a table would be an inbox
 * that is permanently empty. Deriving each item from the condition that
 * causes it means an entry appears the moment it becomes true and disappears
 * when it is resolved — there is no "mark as read", because there is nothing
 * stale to dismiss.
 */
export default async function AdminNotificationsPage() {
  const items = await listAttentionItems();

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[{ label: "Command Center", href: "/admin" }, { label: "Notifications" }]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Needs attention
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Computed from live data rather than stored as messages, so nothing
          here is stale and there is nothing to dismiss — an item disappears
          when the thing causing it is fixed.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nothing needs attention"
          description="No overdue invoices, no reviews awaiting moderation, no keys past rotation and no admin account without a role."
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <ul className="divide-y divide-line-subtle">
              {items.map((item) => {
                const Icon = kindIcon[item.kind];
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl",
                        item.severity === "critical"
                          ? "bg-danger-subtle text-danger"
                          : item.severity === "warning"
                            ? "bg-warning-subtle text-warning"
                            : "bg-info-subtle text-info"
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{item.title}</span>
                      <span className="block text-sm text-ink-tertiary">{item.detail}</span>
                    </span>

                    <Badge variant={severityTone[item.severity]} size="sm">
                      {item.severity}
                    </Badge>

                    <Button variant="outline" size="sm" render={<Link href={item.href} />}>
                      Open
                      <ArrowRight />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
