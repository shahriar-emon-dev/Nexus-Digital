import type { Metadata } from "next";
import Link from "next/link";
import { Network } from "lucide-react";

import { listChannels } from "@/lib/supabase/message-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Threads" };

/**
 * Every channel with recent activity.
 *
 * Messages are not threaded in the schema — there is no parent_message_id — so
 * this lists channels by last activity rather than pretending to a reply tree
 * the data cannot express.
 */
export default async function ClientThreadsPage() {
  const channels = (await listChannels()).filter((c) => c.lastMessageAt);

  return (
    <>
      <DashboardHeader
        title="Threads"
        description="Conversations with recent activity, newest first."
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Messages", href: "/client/messages" },
          { label: "Threads" },
        ]}
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8">
        {channels.length === 0 ? (
          <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
            <Network className="size-8 text-ink-tertiary" aria-hidden />
            <p className="text-ink-tertiary">No conversations have started yet.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {channels.map((c) => (
              <li key={c.id}>
                <Link href={`/client/messages?channel=${c.id}`}>
                  <Card variant="glass" className="flex-row items-center gap-3 rounded-xl p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">#{c.name}</p>
                      <p className="text-[0.75rem] text-ink-tertiary">
                        <time dateTime={c.lastMessageAt!} suppressHydrationWarning>
                          {new Date(c.lastMessageAt!).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <Badge variant="danger" size="sm">
                        {c.unread}
                      </Badge>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
