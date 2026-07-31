"use client";

import * as React from "react";
import { Download, FileText, Maximize2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MessageBlock } from "@/lib/messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Renders one message body block.
 *
 * Blocks are a discriminated union rather than an HTML string, so nothing here
 * needs `dangerouslySetInnerHTML` — a message from another user can never
 * inject markup into the page.
 */
export function MessageBlocks({ blocks }: { blocks: MessageBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "text":
            return (
              <p key={i} className="leading-relaxed text-ink-secondary">
                {block.text}
              </p>
            );

          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-xl border border-line bg-canvas p-4 font-mono text-[0.8125rem] leading-relaxed text-ink"
              >
                <code>{block.code}</code>
                <span className="sr-only"> (end of {block.language} snippet)</span>
              </pre>
            );

          case "image":
            return <ImageBlock key={i} src={block.src} alt={block.alt} />;

          case "file":
            return (
              <FileBlock
                key={i}
                name={block.name}
                size={block.size}
                format={block.format}
              />
            );
        }
      })}
    </>
  );
}

/**
 * The design put the expand affordance behind `opacity-0 group-hover`, which
 * hides it from touch and keyboard entirely. Here the whole preview is the
 * button, and the icon merely brightens on hover.
 */
function ImageBlock({ src, alt }: { src: string; alt: string }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Expand image: ${alt}`}
            className={cn(
              "group/img relative block w-full overflow-hidden rounded-2xl border border-line",
              "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
              "hover:-translate-y-0.5 hover:border-brand-line",
              "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="aspect-video w-full object-cover transition-transform duration-(--duration-slow) ease-(--ease-out-quint) group-hover/img:scale-[1.03]"
            />
            <span
              aria-hidden
              className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full border border-line bg-canvas/80 text-ink-secondary backdrop-blur-md transition-colors group-hover/img:text-brand"
            >
              <Maximize2 className="size-4" />
            </span>
          </button>
        }
      />
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Attachment</DialogTitle>
          <DialogDescription>{alt}</DialogDescription>
        </DialogHeader>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="mt-4 w-full rounded-xl" />
      </DialogContent>
    </Dialog>
  );
}

function FileBlock({
  name,
  size,
  format,
}: {
  name: string;
  size: string;
  format: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface-sunken p-4",
        "transition-[transform,border-color,box-shadow] duration-(--duration-normal) ease-(--ease-out-quint)",
        "hover:-translate-y-0.5 hover:border-brand-line hover:shadow-[0_0_30px_var(--brand-glow)]"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-danger-subtle text-danger">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.875rem] font-semibold text-ink">{name}</p>
          <p className="text-[0.75rem] text-ink-tertiary">
            {size} • {format} document
          </p>
        </div>
      </div>
      {/* TODO: point at the stored asset once the files API lands. */}
      <Button variant="ghost" size="icon-sm" aria-label={`Download ${name}`}>
        <Download />
      </Button>
    </div>
  );
}
