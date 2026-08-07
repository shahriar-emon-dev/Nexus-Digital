import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { NotInstrumented } from "@/components/admin/NotInstrumented";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Drafts" };

/**
 * Honest about a gap rather than filled with something invented.
 *
 * The messages schema has no draft state — a message row exists once it is
 * sent. Building a screen here would mean either faking rows or inventing a
 * storage mechanism the rest of the system knows nothing about, so this names
 * what would have to change instead.
 */
export default function ClientDraftsPage() {
  return (
    <>
      <DashboardHeader
        title="Drafts"
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Messages", href: "/client/messages" },
          { label: "Drafts" },
        ]}
      />

      <div className="mx-auto w-full max-w-2xl px-5 py-10 lg:px-8">
        <NotInstrumented
          icon={FileText}
          title="Drafts are not stored yet"
          summary="Unsent messages live only in the composer on this device. Nothing is kept on the server, so there is no draft to list here or to pick up on another machine."
          needs={[
            {
              label: "A draft state on messages",
              detail:
                "Either a nullable sent_at on public.messages, or a separate drafts table keyed by channel and author.",
            },
            {
              label: "Autosave in the composer",
              detail:
                "The message hub would need to persist as you type, the way the page builder already does.",
            },
          ]}
          related={[
            {
              label: "Messages",
              href: "/client/messages",
              detail: "Send and read messages on your project channels.",
            },
          ]}
        />
      </div>
    </>
  );
}
