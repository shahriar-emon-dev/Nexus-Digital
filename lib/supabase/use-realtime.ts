"use client";

import * as React from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { createClient } from "./client";

/**
 * Subscribes to Postgres changes with the socket properly authorised.
 *
 * Realtime authenticates SEPARATELY from PostgREST. A session cookie is enough
 * to open a channel, but RLS on `postgres_changes` is evaluated against the
 * token handed to `realtime.setAuth` — and that token has to arrive BEFORE
 * `subscribe()`. Miss either and the channel reports SUBSCRIBED, delivers
 * nothing, and raises no error: the subscription looks alive and is inert.
 *
 * Five subscriptions in this codebase were written without it and never
 * delivered a single event. They appeared to work because the action that
 * triggered them also called `router.refresh()` in the same tab, so nothing
 * originating elsewhere ever reached them. This hook exists so that mistake
 * cannot be repeated by writing the obvious code.
 */
export type RealtimeTable = {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  /** PostgREST filter, e.g. `id=eq.${id}`, to avoid waking every subscriber. */
  filter?: string;
};

export function useRealtime(
  channelName: string,
  tables: RealtimeTable[],
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
) {
  // Keeping the callback in a ref means a caller can pass an inline function
  // without tearing down and re-establishing the socket on every render.
  const handler = React.useRef(onChange);
  React.useEffect(() => {
    handler.current = onChange;
  }, [onChange]);

  // Serialised so an inline array literal does not re-subscribe each render.
  const key = JSON.stringify(tables);

  React.useEffect(() => {
    const supabase = createClient();
    const spec = JSON.parse(key) as RealtimeTable[];

    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      // Order matters. Setting this after subscribe() loses the race and the
      // channel evaluates RLS as anon for the life of the connection.
      await supabase.realtime.setAuth(data.session?.access_token ?? null);
      if (cancelled) return;

      let ch = supabase.channel(channelName);
      for (const t of spec) {
        ch = ch.on(
          "postgres_changes",
          {
            event: t.event ?? "*",
            schema: "public",
            table: t.table,
            ...(t.filter ? { filter: t.filter } : {}),
          },
          (payload) => handler.current(payload)
        );
      }
      channel = ch.subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [channelName, key]);
}
