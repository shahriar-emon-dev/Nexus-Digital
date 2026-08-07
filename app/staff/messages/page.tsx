import type { Metadata } from "next";

import { listChannels, listMessages } from "@/lib/supabase/message-actions";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MessagesHub } from "@/app/client/messages/MessagesHub";

export const metadata: Metadata = { title: "Messages" };

/**
 * The same hub the client portal uses.
 *
 * Deliberately not a second implementation: both sides are reading the same
 * channels through the same policies, and a fork would drift. RLS decides which
 * channels each caller is in, so staff see theirs and clients see theirs
 * without this file knowing the difference.
 */
export default async function StaffMessagesPage({
  searchParams,
}: {
  searchParams: { channel?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const channels = await listChannels();
  const requested = searchParams.channel;
  const active =
    (requested && channels.some((c) => c.id === requested) ? requested : null) ??
    channels[0]?.id ??
    null;
  const messages = active ? await listMessages(active) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-svh lg:flex-none lg:overflow-hidden">
      <DashboardHeader
        title="Messages"
        titleAs="p"
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Messages" }]}
      />

      <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-6 pb-4 lg:px-6">
        <h1 className="font-heading text-[2rem] leading-tight font-bold tracking-tight text-ink">
          Conversations
        </h1>
        <p className="text-ink-tertiary">
          <span data-tabular>{channels.length}</span>{" "}
          {channels.length === 1 ? "channel" : "channels"}
        </p>
      </div>

      <MessagesHub
        channels={channels}
        activeChannelId={active}
        messages={messages}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
