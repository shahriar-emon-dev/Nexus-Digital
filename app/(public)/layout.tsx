import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-fg"
      >
        Skip to content
      </a>

      <PublicHeader />

      {/* pt-20 clears the fixed header. `overflow-x-clip` rather than
          `overflow-hidden`: clip contains the ambient blobs without turning
          <main> into a scroll container, which would break `position: sticky`
          for anything a page renders inside it. */}
      <main id="main" className="cyber-grid relative min-h-svh overflow-x-clip pt-20">
        <span
          className="pointer-events-none absolute top-1/4 -left-64 -z-10 size-125 animate-pulse rounded-full bg-brand/10 blur-[120px] motion-reduce:animate-none"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-1/4 -right-64 -z-10 size-150 rounded-full bg-ion/10 blur-[150px]"
          aria-hidden
        />

        <PublicBreadcrumb />
        {children}
      </main>

      <PublicFooter />
    </TooltipProvider>
  );
}
