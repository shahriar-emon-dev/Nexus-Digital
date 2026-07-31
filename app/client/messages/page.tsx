import type { Metadata } from "next";

import { clientAccount } from "@/lib/client-portal";
import { channels, totalUnread } from "@/lib/messages";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MessagesHub } from "./MessagesHub";

export const metadata: Metadata = { title: "Messages" };

export default function ClientMessagesPage() {
  return (
    // From `lg` this route is exactly one viewport tall and never scrolls as a
    // page — the channel list and the thread scroll inside themselves, which is
    // what keeps the composer pinned. Without a definite height here, `flex-1`
    // panes resolve against a container that has already grown to fit them.
    // Below `lg` the panes stack and the page scrolls normally instead.
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
          {channels.length} channels · <span data-tabular>{totalUnread}</span> unread
        </p>
      </div>

      <MessagesHub clientName={clientAccount.name} />
    </div>
  );
}
