"use client";

import * as React from "react";
import { Hash, Info, Phone, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  authorName,
  authorRole,
  channelsByRecency,
  chatMessages,
  CLIENT_AUTHOR,
  latestIn,
  messagesFor,
  previewOf,
  type ChatMessage,
} from "@/lib/messages";
import { leadership } from "@/lib/team";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageBlocks } from "@/components/client/MessageBlocks";
import { MessageComposer } from "@/components/client/MessageComposer";

const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

/** "2m", "4h", "Yesterday" — the channel list's recency column. */
function shortAgo(iso: string, now: number) {
  const mins = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d`;
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export function MessagesHub({ clientName }: { clientName: string }) {
  const [activeId, setActiveId] = React.useState(channelsByRecency[0].id);
  const [query, setQuery] = React.useState("");

  // Relative times are computed after mount. Rendering them on the server would
  // bake in the build time and hydrate to a different string.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const active = channelsByRecency.find((c) => c.id === activeId) ?? channelsByRecency[0];
  const thread = messagesFor(active.id);

  const shownChannels = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channelsByRecency;
    return channelsByRecency.filter((channel) => {
      if (channel.name.toLowerCase().includes(q)) return true;
      // Search the messages too, so a half-remembered phrase finds its channel.
      return chatMessages.some(
        (m) => m.channelId === channel.id && previewOf(m).toLowerCase().includes(q)
      );
    });
  }, [query]);

  const online = active.onlineIds;
  const participants = active.participantIds
    .map((id) => leadership.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      {/* ── Channel list ──────────────────────────────────────────────────── */}
      <section
        aria-label="Channels"
        className="flex min-h-0 shrink-0 flex-col border-line xl:w-80 xl:border-r"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line p-4">
          <h2 className="font-heading text-lg font-semibold text-ink">Channels</h2>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Create a channel">
                  <Plus />
                </Button>
              }
            />
            <TooltipContent>Create a channel</TooltipContent>
          </Tooltip>
        </div>

        <div className="border-b border-line p-3">
          <InputGroup
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels"
            aria-label="Search channels"
            leading={<Search />}
          />
        </div>

        <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          <p aria-live="polite" className="sr-only">
            {shownChannels.length} of {channelsByRecency.length} channels shown.
          </p>

          {shownChannels.map((channel) => {
            const last = latestIn(channel.id);
            const selected = channel.id === active.id;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveId(channel.id)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "group w-full rounded-xl px-3 py-3 text-left",
                  "transition-[background-color,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "border border-brand-line bg-brand-subtle"
                    : "border border-transparent hover:translate-x-0.5 hover:bg-surface-sunken"
                )}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex min-w-0 items-center gap-1 text-[0.875rem] font-semibold",
                      selected ? "text-brand" : "text-ink-secondary group-hover:text-ink"
                    )}
                  >
                    <Hash className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{channel.name}</span>
                  </span>
                  <span className="shrink-0 text-[0.6875rem] text-ink-tertiary">
                    {last && now !== null ? shortAgo(last.sentAt, now) : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-[0.8125rem]",
                      selected ? "text-ink-secondary" : "text-ink-tertiary"
                    )}
                  >
                    {last
                      ? `${authorName(last.authorId, "You")}: ${previewOf(last)}`
                      : "No messages yet"}
                  </span>
                  {channel.unread > 0 && (
                    <Badge variant="solid" size="sm" data-tabular className="shrink-0">
                      {channel.unread}
                      <span className="sr-only"> unread</span>
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}

          {shownChannels.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[0.8125rem] text-ink-tertiary">
              No channels match “{query}”.
            </p>
          )}
        </div>
      </section>

      {/* ── Thread ────────────────────────────────────────────────────────── */}
      <section aria-label="Conversation" className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <h2 className="flex min-w-0 items-center gap-1 font-heading text-lg font-semibold text-ink">
              <Hash className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
              <span className="truncate">{active.name}</span>
            </h2>
            <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />

            <ul className="hidden items-center -space-x-2 sm:flex">
              {participants.map((member, i) => {
                const isOnline = online.includes(member.id);
                return (
                  <li
                    key={member.id}
                    className="relative"
                    style={{ zIndex: participants.length - i }}
                  >
                    <Avatar size="sm" ring title={`${member.name} — ${member.role}`}>
                      <AvatarFallback aria-hidden>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-surface",
                        isOnline ? "bg-success" : "bg-ink-tertiary"
                      )}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {member.name}, {member.role}, {isOnline ? "online" : "away"}
                    </span>
                  </li>
                );
              })}
              {active.extraParticipants > 0 && (
                <li className="relative grid size-8 place-items-center rounded-full bg-surface-sunken text-[0.625rem] font-bold text-ink-secondary ring-2 ring-surface">
                  +{active.extraParticipants}
                </li>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Start a call">
                    <Phone />
                  </Button>
                }
              />
              <TooltipContent>Start a call</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Channel details">
                    <Info />
                  </Button>
                }
              />
              <TooltipContent>{active.purpose}</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
          {thread.map((message, i) => {
            const newDay = i === 0 || dayKey(message.sentAt) !== dayKey(thread[i - 1].sentAt);
            return (
              <React.Fragment key={message.id}>
                {newDay && <DayDivider iso={message.sentAt} />}
                <Bubble message={message} clientName={clientName} />
              </React.Fragment>
            );
          })}
        </div>

        <MessageComposer channelName={active.name} />
      </section>
    </div>
  );
}

function DayDivider({ iso }: { iso: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-line-subtle" aria-hidden />
      <span className="text-[0.6875rem] font-bold tracking-widest text-ink-tertiary uppercase">
        <time dateTime={iso.slice(0, 10)}>{dayLabel.format(new Date(iso))}</time>
      </span>
      <span className="h-px flex-1 bg-line-subtle" aria-hidden />
    </div>
  );
}

function Bubble({ message, clientName }: { message: ChatMessage; clientName: string }) {
  const mine = message.authorId === CLIENT_AUTHOR;
  const name = authorName(message.authorId, clientName);
  const role = authorRole(message.authorId);

  return (
    <article
      className={cn(
        "flex w-full max-w-2xl gap-4",
        mine && "ml-auto flex-row-reverse"
      )}
    >
      <Avatar
        size="lg"
        className={cn("shrink-0 rounded-xl", mine && "bg-brand-subtle text-brand")}
      >
        <AvatarFallback aria-hidden className="rounded-xl">
          {initials(name)}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex min-w-0 flex-col gap-1.5", mine && "items-end")}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            mine && "flex-row-reverse"
          )}
        >
          <span className="text-[0.875rem] font-semibold text-ink">{name}</span>
          <Badge variant={mine ? "brand" : "outline"} size="sm">
            {role}
          </Badge>
          <time
            dateTime={message.sentAt}
            className="text-[0.6875rem] text-ink-tertiary"
            suppressHydrationWarning
          >
            {time.format(new Date(message.sentAt))}
          </time>
        </div>

        <div
          className={cn(
            "flex w-full flex-col gap-3 rounded-2xl p-4",
            "transition-[transform,box-shadow] duration-(--duration-normal) ease-(--ease-out-quint)",
            "hover:-translate-y-0.5 hover:shadow-e2",
            mine
              ? "rounded-tr-none bg-brand text-brand-fg [&_p]:text-brand-fg"
              : "glass rounded-tl-none border border-line"
          )}
        >
          <MessageBlocks blocks={message.blocks} />
        </div>
      </div>
    </article>
  );
}
