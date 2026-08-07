import type { Metadata } from "next";

import { listChannels, listMessages } from "@/lib/supabase/message-actions";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MessagesHub } from "./MessagesHub";

export const metadata: Metadata = { title: "Messages" };

export default async function ClientMessagesPage({
  searchParams,
}: {
  searchParams: { channel?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const channels = await listChannels();

  // The requested channel only wins if the caller is actually in it — otherwise
  // a guessed id in the query string would ask for somebody else's thread. RLS
  // would refuse it anyway; this makes the fallback deliberate rather than an
  // empty pane with no explanation.
  const requested = searchParams.channel;
  const active =
    (requested && channels.some((c) => c.id === requested) ? requested : null) ??
    channels[0]?.id ??
    null;

  const messages = active ? await listMessages(active) : [];
  const unread = channels.reduce((sum, c) => sum + c.unread, 0);

  return (
    // From `lg` this route is exactly one viewport tall and never scrolls as a
    // page — the channel list and the thread scroll inside themselves, which is
    // what keeps the composer pinned. Without a definite height here, `flex-1`
    // panes resolve against a container that has already grown to fit them.
    // `lg:flex-none` matters: as a `flex-1` item this div stretches to its
    // parent and `h-svh` is ignored, which is the whole bug.
    <div className="flex min-h-0 flex-1 flex-col lg:h-svh lg:flex-none lg:overflow-hidden">
      <DashboardHeader
        title="Messages"
        titleAs="p"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Messages" }]}
      />

      <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-6 pb-4 lg:px-6">
        <h1 className="font-heading text-[2rem] leading-tight font-bold tracking-tight text-ink">
          Communication
        </h1>
        <p className="text-ink-tertiary">
          <span data-tabular>{channels.length}</span>{" "}
          {channels.length === 1 ? "channel" : "channels"} ·{" "}
          <span data-tabular>{unread}</span> unread
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
