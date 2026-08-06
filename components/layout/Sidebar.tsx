"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronsLeft, LogOut, Menu, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage, initials } from "@/components/ui/avatar";
import type { AccessLevel } from "@/lib/access-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, Sheet } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "./Logo";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Count badge — e.g. unread messages, pending reviews. */
  badge?: number;
  /** Draws attention without a count — e.g. an overdue invoice. */
  alert?: boolean;
  /** Match child routes too. Defaults to true for everything but the section root. */
  exact?: boolean;
  /**
   * Sub-items, rendered as a disclosure group. Lets a design contribute nav
   * items without lengthening the top level — the parent still navigates.
   */
  children?: NavItem[];
  /**
   * Permission module governing this destination, and the grant it needs.
   *
   * Set these and the item is hidden from anyone whose role cannot reach it.
   * An item without them is visible to everyone in the portal — the default is
   * "show", so forgetting the annotation can never hide a menu item by
   * accident, only leave one visible.
   */
  moduleId?: string;
  minimum?: AccessLevel;
};

export type NavSection = { label?: string; items: NavItem[] };

export type SidebarUser = {
  name: string;
  role: string;
  email?: string;
  avatar?: string;
};

/**
 * The chassis behind the Client, Staff and Admin sidebars. They differ only in
 * their nav data and header slot, so the interaction behaviour — collapse,
 * active-route matching, badges, tooltips when collapsed — lives here once.
 */
export function Sidebar({
  sub,
  sections,
  user,
  header,
  footer,
  className,
}: {
  sub: string;
  sections: NavSection[];
  user: SidebarUser;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  // Persisted for the same reason group expansion is: collapsing the rail to an
  // icon strip and then reloading used to hand it back expanded, so the same
  // route rendered two different sidebars depending on how recently you had
  // reloaded. Starts false on both server and client so hydration matches, and
  // the stored choice is applied after mount.
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    setCollapsed(readRailCollapsed());
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((previous) => {
      writeRailCollapsed(!previous);
      return !previous;
    });
  }, []);

  return (
    <>
      <aside
        data-collapsed={collapsed || undefined}
        className={cn(
          // Below `lg` the rail is replaced by the drawer below — a fixed 16rem
          // column on a 390px phone pushes the content wider than the viewport
          // and leaves the page scrolling sideways into dead space.
          "group/sidebar sticky top-0 hidden h-svh shrink-0 flex-col border-r border-line bg-sidebar lg:flex",
          "transition-[width] duration-(--duration-normal) ease-(--ease-out-quint)",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line-subtle px-4">
        <Logo href="/" sub={collapsed ? undefined : sub} showWordmark={!collapsed} />
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto hidden lg:inline-flex"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <ChevronsLeft
            className={cn(
              "transition-transform duration-(--duration-normal) ease-(--ease-out-quint)",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {header && !collapsed && (
        <div className="border-b border-line-subtle p-3">{header}</div>
      )}

      <nav
        aria-label="Main"
        className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 scrollbar-none"
      >
        <NavSections sections={sections} pathname={pathname} collapsed={collapsed} />
      </nav>

      <div className="shrink-0 border-t border-line-subtle p-2.5">
        {footer && !collapsed && <div className="mb-2">{footer}</div>}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg p-1.5",
            !collapsed && "bg-surface-sunken"
          )}
        >
          <Avatar size="sm">
            {user.avatar && <AvatarImage src={user.avatar} alt="" />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-ink">{user.name}</p>
                <p className="truncate text-[0.6875rem] text-ink-tertiary">{user.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Sign out"
                render={<Link href="/auth/login" />}
              >
                <LogOut />
              </Button>
            </>
          )}
          </div>
        </div>
      </aside>

      {/* Mobile: a fixed bar plus a drawer holding the same navigation. Fixed
          rather than sticky so it stays out of the parent flex row. */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-sidebar/90 px-4 backdrop-blur-lg lg:hidden">
        <Logo href="/" sub={sub} />
        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            }
          />
          <Sheet side="left" className="p-0">
            <div className="flex h-14 shrink-0 items-center border-b border-line-subtle px-4">
              <Logo href="/" sub={sub} />
            </div>
            {header && <div className="border-b border-line-subtle p-3">{header}</div>}
            <nav aria-label="Main" className="flex-1 overflow-y-auto px-2.5 py-4">
              <NavSections sections={sections} pathname={pathname} collapsed={false} />
            </nav>
            <div className="shrink-0 border-t border-line-subtle p-3">
              {footer && <div className="mb-2">{footer}</div>}
              <div className="flex items-center gap-2.5 rounded-lg bg-surface-sunken p-1.5">
                <Avatar size="sm">
                  {user.avatar && <AvatarImage src={user.avatar} alt="" />}
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-ink">{user.name}</p>
                  <p className="truncate text-[0.6875rem] text-ink-tertiary">{user.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Sign out"
                  render={<Link href="/auth/login" />}
                >
                  <LogOut />
                </Button>
              </div>
            </div>
          </Sheet>
        </Dialog>
      </div>
    </>
  );
}

/** Shared by the desktop rail and the mobile drawer so they cannot drift. */
function NavSections({
  sections,
  pathname,
  collapsed,
}: {
  sections: NavSection[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <>
      {sections.map((section, i) => (
        <div key={section.label ?? i} className={cn(i > 0 && "mt-6")}>
          {section.label && !collapsed && (
            <p className="px-2.5 pb-2 text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase">
              {section.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) =>
              // Collapsed to an icon rail there is no room to disclose children,
              // so the parent renders as a plain link and still navigates.
              item.children && !collapsed ? (
                <NavGroup key={item.href} item={item} pathname={pathname} />
              ) : (
                <li key={item.href}>
                  <NavLink item={item} pathname={pathname} collapsed={collapsed} />
                </li>
              )
            )}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Where a person's collapse choices live, so the rail survives a reload. */
const GROUP_PREFS_KEY = "nexus:sidebar-groups";
const RAIL_KEY = "nexus:sidebar-collapsed";

function readRailCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(RAIL_KEY) === "1";
  } catch {
    return false;
  }
}

function writeRailCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RAIL_KEY, collapsed ? "1" : "0");
  } catch {
    /* Preference is a nicety; failing to store it changes nothing else. */
  }
}

function readGroupPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GROUP_PREFS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    // A corrupt or blocked localStorage must not take the navigation with it.
    return {};
  }
}

function writeGroupPref(href: string, open: boolean) {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readGroupPrefs(), [href]: open };
    window.localStorage.setItem(GROUP_PREFS_KEY, JSON.stringify(next));
  } catch {
    /* Preference is a nicety; failing to store it changes nothing else. */
  }
}

/**
 * A nav item with sub-items.
 *
 * Expansion is DETERMINISTIC: the same route renders the same rail every time.
 * It previously seeded `useState(inside)` from the route and had an effect that
 * only ever opened groups, never closed them — so /admin showed 23 links on a
 * fresh load and 25 after you had visited Staff, and a person comparing two
 * tabs saw two different sidebars. Nothing was broken enough to notice, which
 * is why it survived.
 *
 * The rule now: groups are open by default so every destination is visible at a
 * glance, a person may collapse any of them and that choice persists, and the
 * section containing the current route is always forced open so a deep link
 * never lands hidden.
 */
function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const children = item.children ?? [];
  const inside =
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`) ||
    children.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));

  const childMatches = children.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
  );

  // Starts at the default on both server and client, so hydration matches;
  // stored preferences are applied after mount rather than read during render.
  const [preference, setPreference] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const stored = readGroupPrefs()[item.href];
    setPreference(typeof stored === "boolean" ? stored : null);
  }, [item.href]);

  const open = inside || (preference ?? true);

  const setOpen = (next: boolean) => {
    setPreference(next);
    writeGroupPref(item.href, next);
  };

  const panelId = `nav-${item.href.replace(/\W+/g, "-")}`;

  return (
    <li>
      <div className="flex items-stretch gap-0.5">
        <NavLink
          item={item}
          pathname={pathname}
          collapsed={false}
          className="flex-1"
          // A group parent normally links to its own landing page, which is also
          // its first child. Let the child own the highlight so only one row
          // reads as current.
          suppressActive={childMatches}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          // Forced open while you are inside the section, so the control
          // cannot hide the page you are currently looking at.
          disabled={inside}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={
            inside
              ? `${item.label} stays open while you are in this section`
              : `${open ? "Collapse" : "Expand"} ${item.label}`
          }
          className={cn(
            "grid w-7 shrink-0 place-items-center rounded-lg text-ink-tertiary",
            "transition-colors duration-(--duration-fast) hover:bg-surface-sunken hover:text-ink",
            "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          )}
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 transition-transform duration-(--duration-normal) ease-(--ease-out-quint)",
              open && "rotate-180"
            )}
          />
        </button>
      </div>

      {open && (
        <ul
          id={panelId}
          className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-line-subtle pl-2"
        >
          {children.map((child) => (
            <li key={child.href}>
              <NavLink item={child} pathname={pathname} collapsed={false} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function NavLink({
  item,
  pathname,
  collapsed,
  className,
  suppressActive,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  className?: string;
  /** Set when a descendant already owns the current-page highlight. */
  suppressActive?: boolean;
}) {
  const matches = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const active = matches && !suppressActive;
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9.5 items-center gap-3 rounded-lg px-2.5 text-sm font-medium",
        "transition-colors duration-(--duration-fast) ease-(--ease-out-quint)",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
        active
          ? "bg-brand-subtle text-brand-subtle-fg"
          : "text-ink-secondary hover:bg-surface-sunken hover:text-ink",
        collapsed && "justify-center px-0",
        className
      )}
    >
      {active && (
        <span
          className="absolute -left-2.5 h-5 w-0.5 rounded-r-full bg-brand"
          aria-hidden
        />
      )}
      <Icon className="size-4.5 shrink-0" aria-hidden />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <Badge variant={active ? "brand" : "default"} size="sm" data-tabular>
              {item.badge}
            </Badge>
          ) : item.alert ? (
            <>
              <span className="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
              <span className="sr-only">Needs attention</span>
            </>
          ) : null}
        </>
      )}
      {collapsed && (item.badge || item.alert) && (
        <span
          className="absolute top-1.5 right-2 size-1.5 rounded-full bg-danger"
          aria-hidden
        />
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">
        {item.label}
        {item.badge ? ` (${item.badge})` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
