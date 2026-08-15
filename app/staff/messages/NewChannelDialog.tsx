"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { createChannel, type ChannelCandidate } from "@/lib/supabase/message-actions";

/**
 * Starts a conversation.
 *
 * This is the control the messaging system was missing entirely. Every read
 * path, the unread derivation, the realtime subscription and the composer were
 * all written and correct, and nothing anywhere could create the channel row
 * they hang off — so `message_channels` held zero rows and the whole feature
 * was unreachable from the product.
 *
 * Only staff and admins get this, matching the `message_channels` insert policy.
 * A client cannot open a channel with an agency they have no relationship with;
 * their project channel is created for them when the project is.
 */
export function NewChannelDialog({
  candidates,
  projects,
}: {
  candidates: ChannelCandidate[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [pending, startTransition] = React.useTransition();

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // Checkbox state lives in React, so the ids are attached explicitly rather
    // than relying on unchecked boxes being absent from the FormData.
    selected.forEach((id) => form.append("participantIds", id));
    setError(null);

    startTransition(async () => {
      const result = await createChannel(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setSelected([]);
      toast.add({ title: "Conversation started", type: "success" });
      router.push(`?channel=${result.id}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <MessageSquarePlus />
            New conversation
          </Button>
        }
      />
      <DialogContent size="lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New conversation</DialogTitle>
            <DialogDescription>
              Everyone you add can read the whole thread, including its history.
              You are added automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {error && (
              <p role="alert" className="text-[0.875rem] text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="channel-name" className="text-[0.8125rem] font-medium text-ink">
                Name
              </label>
              <Input
                id="channel-name"
                name="name"
                required
                minLength={2}
                maxLength={120}
                placeholder="Website rebuild — weekly"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="channel-purpose" className="text-[0.8125rem] font-medium text-ink">
                Purpose <span className="text-ink-tertiary">(optional)</span>
              </label>
              <Input
                id="channel-purpose"
                name="purpose"
                maxLength={200}
                placeholder="What this thread is for"
              />
            </div>

            {projects.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="channel-project"
                  className="text-[0.8125rem] font-medium text-ink"
                >
                  Project <span className="text-ink-tertiary">(optional)</span>
                </label>
                <Select name="projectId" defaultValue="">
                  <SelectTrigger id="channel-project">
                    <SelectValue placeholder="Not project-specific" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not project-specific</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[0.8125rem] font-medium text-ink">
                People{" "}
                <span className="text-ink-tertiary">
                  ({selected.length} selected)
                </span>
              </legend>

              {candidates.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-tertiary">
                  No other active accounts are visible to you yet. A conversation
                  with only yourself in it is still valid — you can add people
                  later.
                </p>
              ) : (
                <ScrollArea className="max-h-56 rounded-lg border border-line">
                  <ul className="divide-y divide-line-subtle">
                    {candidates.map((person) => (
                      <li key={person.id}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-surface-sunken">
                          <input
                            type="checkbox"
                            checked={selected.includes(person.id)}
                            onChange={() => toggle(person.id)}
                            className="size-4 rounded border-line accent-[var(--brand)]"
                          />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[0.875rem] font-medium text-ink">
                              {person.name}
                            </span>
                            <span className="truncate text-xs text-ink-tertiary">
                              {person.email}
                              {person.organizationName ? ` · ${person.organizationName}` : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-[0.6875rem] tracking-wider text-ink-tertiary uppercase">
                            {person.portal}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </fieldset>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button">Cancel</Button>} />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
              Start conversation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
