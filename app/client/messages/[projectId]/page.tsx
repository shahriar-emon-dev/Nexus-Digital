import { redirect } from "next/navigation";

import { listChannels } from "@/lib/supabase/message-actions";

/**
 * A project's channel.
 *
 * Redirects into the hub rather than rendering a second, near-identical thread
 * view that would drift from it. When no channel exists for the project the
 * hub's own empty state explains why, which is better than a 404.
 */
export default async function ProjectChannelPage({
  params,
}: {
  params: { projectId: string };
}) {
  const channel = (await listChannels()).find((c) => c.projectId === params.projectId);
  redirect(channel ? `/client/messages?channel=${channel.id}` : "/client/messages");
}
