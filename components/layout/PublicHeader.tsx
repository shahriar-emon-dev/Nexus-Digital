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

const serviceGroups = [
  {
    label: "Core",
    icon: LayoutGrid,
    items: [
      { href: "/services/ux-ui-design", label: "UX/UI Design" },
      { href: "/services/web-development", label: "Web Development" },
      { href: "/services/mobile-apps", label: "Mobile Apps" },
    ],
  },
  {
    label: "Specialized",
    icon: Zap,
    items: [
      { href: "/services/cloud-systems", label: "Cloud Systems" },
      { href: "/services/cybersecurity", label: "Cybersecurity" },
      { href: "/services/data-analytics", label: "Data Analytics" },
    ],
  },
  {
    label: "Emerging",
    icon: Rocket,
    items: [
      { href: "/services/ai-machine-learning", label: "AI & Machine Learning" },
      { href: "/services/web3", label: "Web3 Solutions" },
      { href: "/services/ar-vr", label: "AR/VR Platforms" },
    ],
  },
  {
    label: "Strategy",
    icon: BrainCircuit,
    items: [
      { href: "/services/digital-audit", label: "Digital Audit" },
      { href: "/services/brand-positioning", label: "Brand Positioning" },
      { href: "/services/growth-consulting", label: "Growth Consulting" },
    ],
  },
];

const links = [
  { href: "/case-studies", label: "Case Studies" },
  { href: "/about", label: "About Us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Insights" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const servicesActive = pathname.startsWith("/services");

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
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="text-ink-secondary transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
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
