"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

export type CommandItem = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect?: () => void;
  /** Extra words that should match this item without being displayed. */
  keywords?: string;
};

/**
 * ⌘K / Ctrl+K palette. Deliberately a plain filtered list rather than a combobox
 * widget: the whole surface is a listbox with a single active descendant, which
 * is the pattern screen readers handle most predictably.
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? items.filter((i) =>
          `${i.label} ${i.group} ${i.keywords ?? ""}`.toLowerCase().includes(q)
        )
      : items;
    const groups = new Map<string, CommandItem[]>();
    for (const item of matched) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return { groups, flat: matched };
  }, [items, query]);

  React.useEffect(() => setActive(0), [query]);

  const run = React.useCallback(
    (item?: CommandItem) => {
      if (!item) return;
      setOpen(false);
      setQuery("");
      if (item.onSelect) item.onSelect();
      else if (item.href) router.push(item.href);
    },
    [router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results.flat[active]);
    }
  };

  React.useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let index = -1;

  return (
    <>
      <CommandTrigger onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showClose={false} size="lg" className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Command palette</DialogTitle>

          <div className="flex items-center gap-3 border-b border-line-subtle px-4">
            <Search className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search projects, invoices, people…"
              aria-label="Search commands"
              role="combobox"
              aria-expanded
              aria-controls="command-results"
              className="h-13 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
            <Kbd>Esc</Kbd>
          </div>

          <div
            id="command-results"
            ref={listRef}
            role="listbox"
            aria-label="Results"
            className="max-h-88 overflow-y-auto p-2"
          >
            {results.flat.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-ink-tertiary">
                No results for “{query}”.
              </p>
            ) : (
              [...results.groups.entries()].map(([group, groupItems]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 pt-2 pb-1.5 text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase">
                    {group}
                  </p>
                  {groupItems.map((item) => {
                    index += 1;
                    const isActive = index === active;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-active={isActive}
                        onMouseMove={() => setActive(results.flat.indexOf(item))}
                        onClick={() => run(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm",
                          "transition-colors duration-(--duration-instant)",
                          isActive
                            ? "bg-brand-subtle text-brand-subtle-fg"
                            : "text-ink-secondary"
                        )}
                      >
                        {Icon && <Icon className="size-4 shrink-0" />}
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.hint && (
                          <span className="truncate text-xs text-ink-tertiary">{item.hint}</span>
                        )}
                        {isActive && (
                          <CornerDownLeft className="size-3.5 shrink-0 opacity-60" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The visible affordance — a palette nobody knows about is a palette nobody uses. */
function CommandTrigger({ onClick }: { onClick: () => void }) {
  const [meta, setMeta] = React.useState("Ctrl");
  React.useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setMeta("⌘");
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-9 w-full max-w-72 items-center gap-2.5 rounded-lg px-3",
        "border border-line-strong bg-surface-sunken text-sm text-ink-tertiary",
        "transition-colors duration-(--duration-fast) hover:border-brand-line hover:text-ink-secondary",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 text-left">Search…</span>
      <Kbd className="transition-colors group-hover:border-brand-line">{meta} K</Kbd>
    </button>
  );
}
