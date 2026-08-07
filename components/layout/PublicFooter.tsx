"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Services come from the catalogue. Two of the four hardcoded links here
 * (Strategy → digital-audit, Optimization → growth-consulting) pointed at
 * services that were never in the catalogue and had always 404'd.
 */
export type MenuService = { slug: string; title: string };

const resourceColumn = {
  title: "Resources",
  links: [
    { href: "/case-studies", label: "Case Studies" },
    { href: "/blog", label: "Insights" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

/** Four is what the layout was designed around; the rest live on /services. */
const FOOTER_SERVICE_LIMIT = 4;

function buildColumns(services: MenuService[]) {
  const serviceLinks = services
    .slice(0, FOOTER_SERVICE_LIMIT)
    .map((s) => ({ href: `/services/${s.slug}`, label: s.title }));

  // "All services" rather than nothing when the catalogue is empty, so the
  // column never renders as a bare heading.
  if (serviceLinks.length === 0) {
    serviceLinks.push({ href: "/services", label: "All services" });
  } else if (services.length > FOOTER_SERVICE_LIMIT) {
    serviceLinks.push({ href: "/services", label: "See all" });
  }

  return [{ title: "Services", links: serviceLinks }, resourceColumn];
}

/* TODO: swap for the agency's real profile URLs. External so they open in a
   new tab with `rel="noreferrer"`, rather than the `href="#"` dead ends. */
const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/nexus-digital-agency" },
  { label: "X / Twitter", href: "https://x.com/nexusagency" },
  { label: "Behance", href: "https://www.behance.net/nexusagency" },
  { label: "GitHub", href: "https://github.com/nexus-agency" },
];

/**
 * CMS items are appended to the footer's own columns, never substituted for
 * them, for the same reason as the header: the built-in links are the
 * product's information architecture and must always resolve.
 */
export type CmsNavItem = { id: string; label: string; href: string; openInNewTab?: boolean };

export function PublicFooter({
  cmsItems = [],
  services = [],
}: {
  cmsItems?: CmsNavItem[];
  services?: MenuService[];
}) {
  const columns = React.useMemo(() => buildColumns(services), [services]);

  return (
    <footer className="relative w-full border-t border-line bg-surface-sunken">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-20 md:grid-cols-4 md:px-10">
        <div className="flex flex-col gap-6">
          <p className="font-heading text-[2rem] leading-none font-bold text-ink">
            Nexus Digital
          </p>
          <p className="leading-relaxed text-ink-tertiary">
            Pioneering the digital frontier through technical precision and aesthetic mastery.
            We build the future of the web.
          </p>
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-success-line bg-success-subtle px-3 py-1 text-xs font-bold tracking-widest text-success uppercase">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-70 motion-reduce:animate-none" />
              <span className="relative size-2 rounded-full bg-success" />
            </span>
            All systems operational 99.99%
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col gap-6">
            <h2 className="text-xs font-bold tracking-widest text-brand uppercase">
              {col.title}
            </h2>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ink-tertiary transition-colors hover:text-ion focus-visible:text-ion focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="flex flex-col gap-6">
          <h2 className="text-xs font-bold tracking-widest text-brand uppercase">Newsletter</h2>
          <p className="text-sm text-ink-tertiary">
            Get the latest insights on digital transformation.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-line-subtle py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-ink-tertiary md:flex-row md:px-10">
          <span>© {new Date().getFullYear()} Nexus Digital Agency. All rights reserved.</span>
          <div className="flex items-center gap-6">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-sm transition-colors hover:text-brand focus-visible:text-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              >
                {social.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      {cmsItems.length > 0 && (
        <nav
          aria-label="More"
          className="mx-auto w-full max-w-6xl border-t border-line-subtle px-5 py-6 lg:px-8"
        >
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {cmsItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noreferrer noopener" : undefined}
                  className="text-sm text-ink-tertiary transition-colors hover:text-brand"
                >
                  {item.label}
                  {item.openInNewTab && <span className="sr-only"> (opens in a new tab)</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </footer>
  );
}

function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "invalid" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST to a real list. Nothing leaves the browser today.
    const valid = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email);
    setState(valid ? "done" : "invalid");
  };

  if (state === "done") {
    return (
      <p
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-xl border border-success-line bg-success-subtle px-3.5 py-2.5 text-sm text-ink-secondary",
          className
        )}
      >
        <Check className="size-4 shrink-0 text-success" aria-hidden />
        You&rsquo;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-3", className)}>
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <Input
        id="newsletter-email"
        type="email"
        inputMode="email"
        placeholder="email@nexus.digital"
        className="rounded-xl"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "invalid") setState("idle");
        }}
        aria-invalid={state === "invalid"}
        aria-describedby={state === "invalid" ? "newsletter-error" : undefined}
      />
      {state === "invalid" && (
        <p id="newsletter-error" className="text-xs font-medium text-danger">
          Enter a valid email address.
        </p>
      )}
      <Button type="submit" variant="secondary" className="rounded-xl">
        Subscribe
      </Button>
    </form>
  );
}
