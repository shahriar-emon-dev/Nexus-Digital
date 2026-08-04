"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Indent,
  Link2,
  Loader2,
  Outdent,
  Plus,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  addMenuItem,
  deleteMenu,
  deleteMenuItem,
  reorderMenuItems,
  setHomepage,
  updateMenu,
  updateMenuItem,
  type Menu,
  type MenuItem,
  type MenuItemType,
  type MenuLocation,
} from "@/lib/supabase/nav-actions";
import type { PageRecord } from "@/lib/supabase/page-actions";
import { cn } from "@/lib/utils";

const LOCATIONS: { value: MenuLocation; label: string }[] = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "mobile", label: "Mobile" },
  { value: "utility", label: "Utility bar" },
];

/**
 * Navigation manager.
 *
 * Ordering is a stored integer, not an array index, and nesting is a parent
 * reference — so two administrators editing at once cannot silently reorder
 * each other's work, and a reorder is persisted rather than held in state.
 */
export function NavigationManager({
  menus,
  items,
  pages,
  homepageId,
}: {
  menus: Menu[];
  items: Record<string, MenuItem[]>;
  pages: PageRecord[];
  homepageId: string | null;
}) {
  const router = useRouter();
  const toast = useToast();

  const [active, setActive] = React.useState<string | null>(menus[0]?.id ?? null);

  // `menus` arrives as a prop and changes after a refresh. Without this, the
  // first menu an admin creates leaves nothing selected and the editor pane
  // never appears — and a deleted menu leaves a dangling selection.
  React.useEffect(() => {
    if (menus.length === 0) {
      setActive(null);
      return;
    }
    if (!active || !menus.some((m) => m.id === active)) setActive(menus[0].id);
  }, [menus, active]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const menu = menus.find((m) => m.id === active) ?? null;
  const menuItems = active ? (items[active] ?? []) : [];

  const roots = menuItems.filter((i) => !i.parent_id);
  const childrenOf = (id: string) => menuItems.filter((i) => i.parent_id === id);
  const published = pages.filter((p) => p.status === "published");

  async function run(fn: () => Promise<{ error: string } | { ok: true }>, ok?: string) {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return false;
    }
    if (ok) toast.add({ title: ok, type: "success" });
    router.refresh();
    return true;
  }

  /** Swaps with the neighbour at the same level and persists both positions. */
  async function move(item: MenuItem, delta: number) {
    const siblings = menuItems
      .filter((i) => i.parent_id === item.parent_id)
      .sort((a, b) => a.position - b.position);
    const i = siblings.findIndex((s) => s.id === item.id);
    const j = i + delta;
    if (j < 0 || j >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];

    await run(
      () =>
        reorderMenuItems(
          reordered.map((s, idx) => ({ id: s.id, position: idx + 1, parent_id: s.parent_id }))
        ),
      "Order saved"
    );
  }

  /** Nests an item under the root immediately above it. */
  async function indent(item: MenuItem) {
    const above = roots
      .filter((r) => r.position < item.position)
      .sort((a, b) => b.position - a.position)[0];
    if (!above) {
      setError("There is no item above this one to nest it under.");
      return;
    }
    await run(
      () => reorderMenuItems([{ id: item.id, position: item.position, parent_id: above.id }]),
      `Nested under ${above.label}`
    );
  }

  /**
   * Dragging reorders within a level and persists immediately.
   *
   * Dropping onto a ROOT item while dragging a root reorders; dropping a root
   * onto another root's child area is not offered, because nesting is an
   * explicit action (the indent button) rather than something a stray drop
   * should do by accident.
   */
  async function onDropItem(target: MenuItem) {
    const sourceId = dragging;
    setDragging(null);
    setDragOver(null);
    if (!sourceId || sourceId === target.id) return;

    const source = menuItems.find((i) => i.id === sourceId);
    if (!source || source.parent_id !== target.parent_id) return;

    const siblings = menuItems
      .filter((i) => i.parent_id === source.parent_id)
      .sort((a, b) => a.position - b.position);

    const from = siblings.findIndex((i) => i.id === source.id);
    const to = siblings.findIndex((i) => i.id === target.id);
    const next = [...siblings];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    await run(
      () =>
        reorderMenuItems(
          next.map((i, idx) => ({ id: i.id, position: idx + 1, parent_id: i.parent_id }))
        ),
      "Order saved"
    );
  }

  async function outdent(item: MenuItem) {
    await run(
      () => reorderMenuItems([{ id: item.id, position: item.position, parent_id: null }]),
      "Moved to the top level"
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ------------------------------------------------ site homepage --- */}
      <Card>
        <CardHeader>
          <CardTitle>Site homepage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-64 flex-col gap-1.5">
            <Label htmlFor="homepage">Page shown at /</Label>
            <Select
              value={homepageId ?? "default"}
              onValueChange={(v) =>
                run(() => setHomepage(v === "default" ? null : (v as string)), "Homepage updated")
              }
            >
              <SelectTrigger id="homepage" aria-label="Site homepage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Built-in marketing homepage</SelectItem>
                {published.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} (/{p.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="max-w-sm text-xs text-ink-tertiary">
            Only published pages can be chosen. Selecting one makes it answer the
            root URL without a deploy.
          </p>
        </CardContent>
      </Card>

      {menus.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No menus yet"
          description="Create a menu, assign it a location, then add pages to it."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* ------------------------------------------------- menu list -- */}
          <Card>
            <CardContent className="p-3">
              <ul className="flex flex-col gap-1">
                {menus.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setActive(m.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left transition-colors",
                        active === m.id ? "bg-brand-subtle text-brand-subtle-fg" : "hover:bg-surface-sunken"
                      )}
                    >
                      <span className="block text-sm font-medium">{m.name}</span>
                      <span className="mt-0.5 block text-xs text-ink-tertiary">
                        {m.location ? LOCATIONS.find((l) => l.value === m.location)?.label : "Not assigned"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* ------------------------------------------------ menu editor -- */}
          {menu && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="flex flex-wrap items-end gap-4 py-5">
                  <div className="flex min-w-48 flex-col gap-1.5">
                    <Label htmlFor="menu-name">Menu name</Label>
                    <Input
                      id="menu-name"
                      defaultValue={menu.name}
                      onBlur={(e) =>
                        e.target.value !== menu.name &&
                        run(() => updateMenu(menu.id, { name: e.target.value }), "Menu renamed")
                      }
                    />
                  </div>
                  <div className="flex min-w-44 flex-col gap-1.5">
                    <Label htmlFor="menu-location">Location</Label>
                    <Select
                      value={menu.location ?? "none"}
                      onValueChange={(v) =>
                        run(
                          () =>
                            updateMenu(menu.id, {
                              location: v === "none" ? null : (v as MenuLocation),
                            }),
                          "Location updated"
                        )
                      }
                    >
                      <SelectTrigger id="menu-location" aria-label="Menu location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not assigned</SelectItem>
                        {LOCATIONS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    disabled={busy}
                    onClick={() => run(() => deleteMenu(menu.id), "Menu deleted")}
                  >
                    <Trash2 />
                    Delete menu
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  {busy && (
                    <Loader2 className="size-4 animate-spin text-ink-tertiary motion-reduce:animate-none" />
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {menuItems.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-tertiary">
                      No items yet. Add a page or a link below.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {roots
                        .sort((a, b) => a.position - b.position)
                        .flatMap((root) => [
                          <Row
                            key={root.id}
                            item={root}
                            pages={pages}
                            busy={busy}
                            onMove={move}
                            onIndent={indent}
                            onOutdent={outdent}
                            onToggle={(it) =>
                              run(() => updateMenuItem(it.id, { is_visible: !it.is_visible }))
                            }
                            onDelete={(it) => run(() => deleteMenuItem(it.id), "Item removed")}
                            dragging={dragging}
                            dragOver={dragOver}
                            onDragStart={setDragging}
                            onDragOverItem={setDragOver}
                            onDropItem={onDropItem}
                          />,
                          ...childrenOf(root.id)
                            .sort((a, b) => a.position - b.position)
                            .map((child) => (
                              <Row
                                key={child.id}
                                item={child}
                                nested
                                pages={pages}
                                busy={busy}
                                onMove={move}
                                onIndent={indent}
                                onOutdent={outdent}
                                onToggle={(it) =>
                                  run(() => updateMenuItem(it.id, { is_visible: !it.is_visible }))
                                }
                                onDelete={(it) => run(() => deleteMenuItem(it.id), "Item removed")}
                                dragging={dragging}
                                dragOver={dragOver}
                                onDragStart={setDragging}
                                onDragOverItem={setDragOver}
                                onDropItem={onDropItem}
                              />
                            )),
                        ])}
                    </ul>
                  )}

                  <AddItem
                    menuId={menu.id}
                    pages={published}
                    busy={busy}
                    onAdded={() => router.refresh()}
                    onError={setError}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  item,
  nested,
  pages,
  busy,
  onMove,
  onIndent,
  onOutdent,
  onToggle,
  onDelete,
  dragging,
  dragOver,
  onDragStart,
  onDragOverItem,
  onDropItem,
}: {
  item: MenuItem;
  nested?: boolean;
  pages: PageRecord[];
  busy: boolean;
  onMove: (i: MenuItem, d: number) => void;
  onIndent: (i: MenuItem) => void;
  onOutdent: (i: MenuItem) => void;
  onToggle: (i: MenuItem) => void;
  onDelete: (i: MenuItem) => void;
  dragging: string | null;
  dragOver: string | null;
  onDragStart: (id: string | null) => void;
  onDragOverItem: (id: string | null) => void;
  onDropItem: (i: MenuItem) => void;
}) {
  const page = item.page_id ? pages.find((p) => p.id === item.page_id) : null;
  // A page item whose target is not published is shown as a warning here rather
  // than silently dropped — the editor needs to know why it vanished publicly.
  const unpublished = item.item_type === "page" && page && page.status !== "published";

  return (
    <li
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragEnd={() => {
        onDragStart(null);
        onDragOverItem(null);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (dragging && dragging !== item.id) onDragOverItem(item.id);
      }}
      onDragLeave={() => onDragOverItem(null)}
      onDrop={(e) => {
        e.preventDefault();
        onDropItem(item);
      }}
      className={cn(
        nested && "ml-8",
        "rounded-lg transition-[box-shadow,opacity]",
        dragging === item.id && "opacity-40",
        dragOver === item.id && "shadow-[inset_0_2px_0_0_var(--brand)]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2",
          item.is_visible ? "border-line" : "border-dashed border-line-strong opacity-60"
        )}
      >
        <span
          aria-hidden
          className="cursor-grab text-ink-tertiary active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </span>
        {item.item_type === "page" ? (
          <FileText className="size-3.5 shrink-0 text-ink-tertiary" aria-hidden />
        ) : (
          <ExternalLink className="size-3.5 shrink-0 text-ink-tertiary" aria-hidden />
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
          <span className="block truncate font-mono text-xs text-ink-tertiary">
            {item.item_type === "page" ? (page ? `/${page.slug}` : "missing page") : item.external_url}
          </span>
        </span>

        {unpublished && <Badge variant="warning" size="sm">Page not published</Badge>}
        {!item.is_visible && <Badge size="sm">Hidden</Badge>}

        <span className="flex shrink-0 items-center">
          <IconBtn label="Move up" onClick={() => onMove(item, -1)} disabled={busy}>
            <ArrowUp />
          </IconBtn>
          <IconBtn label="Move down" onClick={() => onMove(item, 1)} disabled={busy}>
            <ArrowDown />
          </IconBtn>
          {nested ? (
            <IconBtn label="Move to top level" onClick={() => onOutdent(item)} disabled={busy}>
              <Outdent />
            </IconBtn>
          ) : (
            <IconBtn label="Nest under item above" onClick={() => onIndent(item)} disabled={busy}>
              <Indent />
            </IconBtn>
          )}
          <IconBtn
            label={item.is_visible ? "Hide" : "Show"}
            onClick={() => onToggle(item)}
            disabled={busy}
          >
            {item.is_visible ? <Eye /> : <EyeOff />}
          </IconBtn>
          <IconBtn label="Remove" onClick={() => onDelete(item)} disabled={busy} danger>
            <Trash2 />
          </IconBtn>
        </span>
      </div>
    </li>
  );
}

function AddItem({
  menuId,
  pages,
  busy,
  onAdded,
  onError,
}: {
  menuId: string;
  pages: PageRecord[];
  busy: boolean;
  onAdded: () => void;
  onError: (m: string) => void;
}) {
  const [type, setType] = React.useState<MenuItemType>("page");
  const [label, setLabel] = React.useState("");
  const [pageId, setPageId] = React.useState("");
  const [url, setUrl] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await addMenuItem(menuId, {
      label,
      item_type: type,
      page_id: type === "page" ? pageId : null,
      external_url: type === "page" ? null : url,
    });
    if ("error" in result) {
      onError(result.error);
      return;
    }
    setLabel("");
    setUrl("");
    setPageId("");
    onAdded();
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-3 border-t border-line-subtle pt-4"
    >
      <div className="flex w-36 flex-col gap-1.5">
        <Label htmlFor="item-type">Link type</Label>
        <Select value={type} onValueChange={(v) => setType(v as MenuItemType)}>
          <SelectTrigger id="item-type" size="sm" aria-label="Link type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="page">Internal page</SelectItem>
            <SelectItem value="external">External URL</SelectItem>
            <SelectItem value="anchor">Anchor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === "page" ? (
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <Label htmlFor="item-page">Page</Label>
          <Select value={pageId} onValueChange={(v) => setPageId(v as string)}>
            <SelectTrigger id="item-page" size="sm" aria-label="Page">
              <SelectValue placeholder="Choose a published page…" />
            </SelectTrigger>
            <SelectContent>
              {pages.length === 0 ? (
                <SelectItem value="" disabled>
                  No published pages yet
                </SelectItem>
              ) : (
                pages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} (/{p.slug})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <Label htmlFor="item-url">URL</Label>
          <Input
            id="item-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={type === "anchor" ? "#pricing" : "https://example.com"}
          />
        </div>
      )}

      <div className="flex min-w-40 flex-col gap-1.5">
        <Label htmlFor="item-label">Label</Label>
        <Input
          id="item-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Services"
          required
        />
      </div>

      <Button type="submit" size="sm" disabled={busy}>
        <Plus />
        Add item
      </Button>
    </form>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-6 place-items-center rounded text-ink-tertiary transition-colors",
        "hover:bg-surface-sunken hover:text-ink disabled:opacity-30",
        "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
        danger && "hover:bg-danger-subtle hover:text-danger",
        "[&_svg]:size-3.5"
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
