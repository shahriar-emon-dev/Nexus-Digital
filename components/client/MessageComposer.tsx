"use client";

import * as React from "react";
import {
  Bold,
  Code2,
  Italic,
  List,
  Paperclip,
  SendHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const tools = [
  { id: "bold", label: "Bold", icon: Bold, wrap: "**" },
  { id: "italic", label: "Italic", icon: Italic, wrap: "_" },
  { id: "list", label: "Bulleted list", icon: List, prefix: "- " },
  { id: "code", label: "Code", icon: Code2, wrap: "`" },
] as const;

/**
 * Message composer.
 *
 * The source's toolbar buttons had no handlers at all — they were decoration.
 * These wrap the current selection, which is the least a formatting button can
 * honestly do without a rich-text engine.
 *
 * Sending is not wired to anything yet, so the button reports that plainly
 * rather than clearing the box and pretending the message went out.
 */
export function MessageComposer({ channelName }: { channelName: string }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);

  // Grow with the content up to a ceiling, then scroll. Runs on value change
  // rather than on `input`, so programmatic edits resize too.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    el.style.overflowY = el.scrollHeight > 180 ? "auto" : "hidden";
  }, [value]);

  function applyTool(tool: (typeof tools)[number]) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end);

    const next =
      "wrap" in tool
        ? `${value.slice(0, start)}${tool.wrap}${selected}${tool.wrap}${value.slice(end)}`
        : `${value.slice(0, start)}${tool.prefix}${selected}${value.slice(end)}`;

    setValue(next);
    const offset = "wrap" in tool ? tool.wrap.length : tool.prefix.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + offset, end + offset);
    });
  }

  function send() {
    if (!value.trim()) return;
    // TODO: POST to /api/client once the messages mutation lands, then clear
    // the box and append the message optimistically.
    setNotice("Sending is not connected yet — your draft has been kept.");
  }

  return (
    <div className="p-4 lg:p-6">
      <div
        className={cn(
          "glass overflow-hidden rounded-2xl border border-line shadow-e3",
          "transition-colors duration-(--duration-normal)",
          "focus-within:border-brand-line"
        )}
      >
        <div
          role="toolbar"
          aria-label="Formatting"
          aria-controls="message-composer"
          className="flex items-center gap-1 border-b border-line-subtle bg-surface-sunken/60 p-2"
        >
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={tool.label}
                    onClick={() => applyTool(tool)}
                  >
                    <tool.icon />
                  </Button>
                }
              />
              <TooltipContent>{tool.label}</TooltipContent>
            </Tooltip>
          ))}

          <span className="mx-1 h-5 w-px bg-line" aria-hidden />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Attach a file">
                  <Paperclip />
                </Button>
              }
            />
            <TooltipContent>Attach a file</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-end gap-3 p-3">
          <label htmlFor="message-composer" className="sr-only">
            Message #{channelName}
          </label>
          <textarea
            id="message-composer"
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (notice) setNotice(null);
            }}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter is a newline — the convention every
              // chat client uses.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message #${channelName}…`}
            className={cn(
              "scrollbar-none max-h-45 min-h-11 flex-1 resize-none bg-transparent py-2.5",
              "text-ink placeholder:text-ink-tertiary focus:outline-none"
            )}
          />

          <Button
            size="icon-lg"
            onClick={send}
            disabled={!value.trim()}
            aria-label="Send message"
            className={cn(
              "shrink-0 rounded-xl transition-transform hover:scale-105 active:scale-95",
              // The glow is the design's `animate-pulse-glow`, but only once
              // there is something to send — a button pulsing at an empty box
              // is just noise.
              value.trim() && "animate-pulse-glow motion-reduce:animate-none"
            )}
          >
            <SendHorizontal />
          </Button>
        </div>
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mt-2 px-1 text-[0.8125rem] text-warning",
          !notice && "sr-only"
        )}
      >
        {notice}
      </p>
    </div>
  );
}
