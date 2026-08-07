"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Hash, Loader2, Search, SendHorizonal, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/use-realtime";
import type { ChannelMessage, ChannelSummary } from "@/lib/supabase/message-actions";
import { markChannelRead, sendMessage } from "@/lib/supabase/message-actions";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input";
import { MessageBlocks } from "@/components/client/MessageBlocks";

/**
 * The conversation centre.
 *
 * Channels and the opening thread are loaded on the server; switching channel
 * navigates so the next thread is fetched the same way rather than through a
 * second client-side data path. New messages arrive over realtime.
 *
 * The version this replaces read three static arrays, so every client saw the
 * same conversation between people who did not work here.
 */
export function MessagesHub({
  channels,
  activeChannelId,
  messages,
  currentUserId,
}: {
  channels: ChannelSummary[];
  activeChannelId: string | null;
  messages: ChannelMessage[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const threadRef = React.useRef<HTMLDivElement>(null);

  // A message from anyone in any of the caller's channels refreshes the route.
  // RLS decides which rows the subscription is allowed to deliver.
  useRealtime("client:messages", [{ table: "messages" }], () => router.refresh());

  const active = channels.find((c) => c.id === activeChannelId) ?? channels[0] ?? null;

  // Opening a channel is reading it. Runs after paint so it never blocks render.
  React.useEffect(() => {
    if (!active || active.unread === 0) return;
    void markChannelRead(active.id).then(() => router.refresh());
  }, [active, router]);

  React.useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages.length]);

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.purpose ?? "").toLowerCase().includes(q) ||
        c.participants.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [channels, query]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await sendMessage(active.id, form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-sm text-center">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-brand/10">
            <Hash className="size-7 text-brand" aria-hidden />
          </span>
          <h2 className="font-heading text-xl font-semibold text-ink">No channels yet</h2>
          <p className="mt-2 text-[0.9375rem] text-ink-tertiary">
            A channel opens automatically when your first project starts. Your team can also
            open a direct line from their side.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6 lg:flex-row lg:px-6">
      {/* ── Channel list ──────────────────────────────────────────────────── */}
      <aside className="flex min-h-0 shrink-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-3 lg:w-72">
        <InputGroup
          leading={<Search className="size-4" aria-hidden />}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search channels"
          aria-label="Search channels"
        />

        <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {shown.length === 0 && (
            <li className="px-3 py-6 text-center text-[0.8125rem] text-ink-tertiary">
              Nothing matches “{query}”.
            </li>
          )}
          {shown.map((channel) => {
            const isActive = channel.id === active?.id;
            return (
              <li key={channel.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/client/messages?channel=${channel.id}`)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                    isActive ? "bg-brand/10 text-brand" : "text-ink-secondary hover:bg-surface-sunken"
                  )}
                >
                  <Hash className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium">
                    {channel.name}
                  </span>
                  {channel.unread > 0 && (
                    <Badge variant="danger" size="sm" data-tabular>
                      {channel.unread}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ── Thread ────────────────────────────────────────────────────────── */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-surface">
        {active && (
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 font-heading text-lg font-semibold text-ink">
                <Hash className="size-4 text-ink-tertiary" aria-hidden />
                {active.name}
              </h2>
              {active.purpose && (
                <p className="truncate text-[0.8125rem] text-ink-tertiary">{active.purpose}</p>
              )}
            </div>

            <p className="flex items-center gap-2 text-[0.8125rem] text-ink-tertiary">
              <Users className="size-4" aria-hidden />
              <span data-tabular>{active.participants.length}</span>
              {active.participants.length === 1 ? "member" : "members"}
            </p>
          </header>
        )}

        <div ref={threadRef} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="my-auto text-center text-[0.875rem] text-ink-tertiary">
              No messages in this channel yet. Say hello.
            </p>
          )}

          {messages.map((message) => {
            const mine = message.authorId === currentUserId;
            return (
              <article
                key={message.id}
                className={cn("flex max-w-[46rem] gap-3", mine && "ml-auto flex-row-reverse")}
              >
                <Avatar size="sm" className="mt-1 shrink-0 rounded-lg">
                  <AvatarFallback>{initials(message.authorName)}</AvatarFallback>
                </Avatar>

                <div className={cn("min-w-0", mine && "text-right")}>
                  <p className="mb-1 flex items-baseline gap-2 text-[0.8125rem]">
                    <span className="font-semibold text-ink">{message.authorName}</span>
                    <time
                      dateTime={message.sentAt}
                      className="text-ink-tertiary"
                      suppressHydrationWarning
                    >
                      {new Date(message.sentAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </p>
                  <MessageBlocks blocks={message.blocks} />
                </div>
              </article>
            );
          })}
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-line p-4"
        >
          {error && (
            <p role="alert" className="text-[0.8125rem] text-danger">
              {error}
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="message-body" className="sr-only">
              Message {active?.name ?? "channel"}
            </label>
            <textarea
              id="message-body"
              name="body"
              rows={2}
              required
              placeholder={active ? `Message #${active.name}` : "Message"}
              className="min-h-11 flex-1 resize-y rounded-xl border border-line bg-surface-sunken px-4 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            />
            <Button type="submit" size="lg" className="rounded-xl" disabled={pending || !active}>
              {pending ? (
                <Loader2 className="animate-spin motion-reduce:animate-none" />
              ) : (
                <SendHorizonal />
              )}
              <span className="sr-only sm:not-sr-only">Send</span>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
