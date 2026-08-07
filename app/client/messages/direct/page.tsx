import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { listChannels } from "@/lib/supabase/message-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Direct Messages" };

/** Was a placeholder. Direct channels are the ones flagged `is_direct`. */
export default async function ClientDirectMessagesPage() {
  const direct = (await listChannels()).filter((c) => c.isDirect);

  return (
    <>
      <DashboardHeader
        title="Direct Messages"
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Messages", href: "/client/messages" },
          { label: "Direct" },
        ]}
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8">
        {direct.length === 0 ? (
          <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
            <MessagesSquare className="size-8 text-ink-tertiary" aria-hidden />
            <h2 className="font-heading text-xl font-semibold text-ink">No direct lines yet</h2>
            <p className="max-w-sm text-ink-tertiary">
              Your account manager can open a direct channel with you. Project channels live
              under Messages.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {direct.map((c) => (
              <li key={c.id}>
                <Link href={`/client/messages?channel=${c.id}`}>
                  <Card variant="glass" className="flex-row items-center gap-3 rounded-xl p-4">
                    <MessagesSquare className="size-5 shrink-0 text-brand" aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{c.name}</span>
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
