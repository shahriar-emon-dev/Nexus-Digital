"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, ChevronDown, LayoutGrid, Menu, Rocket, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, Sheet } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/**
 * The mega-menu's shape is owned here; its contents come from the catalogue.
 *
 * Every item used to be typed in, and seven of the twelve pointed at pages that
 * did not exist — three services that were never published, and four
 * (Web3, AR/VR, Digital Audit, Growth Consulting) that were never in the
 * catalogue at all. Every one of those was a 404 reached from the site's
 * primary navigation.
 *
 * The columns and their icons stay developer-owned so the information
 * architecture does not shift under an editor; which services appear in them is
 * read from published service pages. Publishing a service puts it in the menu,
 * unpublishing takes it out, and a link can no longer outlive its page.
 */
export type MenuService = { slug: string; title: string; category: string | null };

const serviceColumns = [
  { label: "Core", icon: LayoutGrid, categories: ["Engineering", "Design"] },
  { label: "Specialized", icon: Zap, categories: ["Infrastructure"] },
  { label: "Emerging", icon: Rocket, categories: ["Growth"] },
  { label: "Strategy", icon: BrainCircuit, categories: ["Strategy"] },
];

/**
 * A service whose category matches no column still appears, in the nearest
 * general one, rather than being silently dropped — an editor inventing a new
 * category should not make a published service unreachable from the menu.
 */
function groupServices(services: MenuService[]) {
  const claimed = new Set(serviceColumns.flatMap((c) => c.categories));

  return serviceColumns
    .map((column, index) => ({
      ...column,
      items: services.filter(
        (s) =>
          (s.category !== null && column.categories.includes(s.category)) ||
          // Unmatched services land in the first column.
          (index === 0 && (s.category === null || !claimed.has(s.category)))
      ),
    }))
    .filter((column) => column.items.length > 0);
}

const links = [
  { href: "/case-studies", label: "Case Studies" },
  { href: "/about", label: "About Us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Insights" },
];

/**
 * CMS-managed entries are APPENDED to the links above, never substituted for
 * them. The list above is the product's own information architecture, owned by
 * developers and guaranteed to resolve; a menu built in the admin adds to it.
 *
 * That ordering also means assigning a header menu can never blank the site,
 * and removing one cannot take Services or Pricing down with it.
 */
export type CmsNavItem = { id: string; label: string; href: string; openInNewTab?: boolean };

export function PublicHeader({
  cmsItems = [],
  services = [],
}: {
  cmsItems?: CmsNavItem[];
  services?: MenuService[];
}) {
  const pathname = usePathname();
  const servicesActive = pathname.startsWith("/services");
  const serviceGroups = React.useMemo(() => groupServices(services), [services]);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-line bg-surface/80 shadow-[0_20px_50px_-12px_var(--brand-glow)] backdrop-blur-lg">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 md:px-10">
        <Link
          href="/"
          className="bg-gradient-to-r from-brand to-ion bg-clip-text font-heading text-[1.75rem] leading-none font-bold tracking-tight text-transparent"
        >
          Nexus Digital
        </Link>

        <ul className="hidden items-center gap-8 text-ink-secondary md:flex">
          <li>
            <Popover>
              {/* The source opened this on hover only, which locks out keyboard
                  users entirely. Hover is kept as a convenience; click and
                  Enter/Space still work, and Escape closes. */}
              <PopoverTrigger
                openOnHover
                delay={120}
                render={
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 border-b-2 pb-1 transition-colors duration-300",
                      "hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                      servicesActive
                        ? "border-brand text-brand"
                        : "border-transparent text-ink-secondary"
                    )}
                  >
                    Services
                    <ChevronDown className="size-4 transition-transform duration-(--duration-fast) in-data-popup-open:rotate-180" />
                  </button>
                }
              />
              <PopoverContent
                align="center"
                sideOffset={14}
                className="glass w-[min(50rem,calc(100vw-2rem))] rounded-xl p-8 shadow-e4"
              >
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                  {serviceGroups.map((group) => (
                    <div key={group.label} className="flex flex-col gap-4">
                      <p className="flex items-center gap-2 text-brand">
                        <group.icon className="size-5" aria-hidden />
                        <span className="font-bold">{group.label}</span>
                      </p>
                      <ul className="flex flex-col gap-2 text-sm">
                        {group.items.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={`/services/${item.slug}`}
                              className="text-ink-secondary transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none"
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Always present, so the menu is never a dead end while the
                    catalogue is empty and there is always a way to the full
                    list from a column that only shows part of it. */}
                <Link
                  href="/services"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline focus-visible:outline-none"
                >
                  {serviceGroups.length > 0 ? "See all services" : "Browse services"}
                </Link>
              </PopoverContent>
            </Popover>
          </li>

          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-block transition-colors duration-300 hover:text-brand",
                    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                    active && "text-brand"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}

          {cmsItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noreferrer noopener" : undefined}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "inline-block transition-colors duration-300 hover:text-brand",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  pathname === item.href && "text-brand"
                )}
              >
                {item.label}
                {item.openInNewTab && <span className="sr-only"> (opens in a new tab)</span>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/auth/login"
            className="hidden text-xs font-semibold tracking-widest text-ink-secondary uppercase transition-colors hover:text-brand lg:block"
          >
            Client Portal
          </Link>
          <Button
            className="hidden rounded-full animate-pulse-glow sm:inline-flex motion-reduce:animate-none"
            render={<Link href="/book-meeting" />}
          >
            Book Discovery Call
          </Button>

          <Dialog>
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              }
            />
            <Sheet side="right" className="p-5">
              <p className="mb-4 text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase">
                Menu
              </p>
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                <Link
                  href="/services"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-sunken hover:text-ink"
                >
                  Services
                </Link>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-sunken hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
                {cmsItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noreferrer noopener" : undefined}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-sunken hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2">
                <Button className="rounded-full" render={<Link href="/book-meeting" />}>
                  Book Discovery Call
                </Button>
                <Button variant="outline" render={<Link href="/auth/login" />}>
                  Client Portal
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-ink-tertiary">Theme</span>
                <ThemeToggle />
              </div>
            </Sheet>
          </Dialog>
        </div>
      </nav>
    </header>
  );
}
