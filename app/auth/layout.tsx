import Link from "next/link";
import { Quote } from "lucide-react";

import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/**
 * Split auth shell: the form gets a calm, undecorated column; the brand panel
 * sits beside it on wide screens and disappears entirely on small ones, where
 * the screen's only job is to get the credentials in.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col">
        <header className="flex items-center justify-between gap-3 px-6 py-5">
          <Logo />
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="px-6 py-5 text-xs text-ink-tertiary">
          <Link href="/" className="transition-colors hover:text-ink-secondary">
            ← Back to nexus.agency
          </Link>
        </footer>
      </div>

      <aside className="relative isolate hidden overflow-hidden border-l border-line bg-surface lg:flex lg:flex-col lg:justify-end">
        <div className="aurora-field" aria-hidden />
        <div className="absolute inset-0 grid-field" aria-hidden />
        <figure className="relative max-w-lg p-12">
          <Quote className="size-7 text-brand" aria-hidden />
          <blockquote className="mt-5 font-heading text-h3 leading-snug font-medium text-balance text-ink">
            “I could open a tab on a Tuesday and know exactly what nine people were doing with
            our money.”
          </blockquote>
          <figcaption className="mt-5 text-sm text-ink-tertiary">
            <span className="font-medium text-ink">Priya Raman</span> · VP Growth, Northwind
            Retail
          </figcaption>
        </figure>
      </aside>
    </div>
  );
}
