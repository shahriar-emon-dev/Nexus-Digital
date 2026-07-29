import { StaffSidebar } from "@/components/layout/StaffSidebar";
import { FloatingTimer } from "@/components/staff/FloatingTimer";
import { TooltipProvider } from "@/components/ui/tooltip";

const statusLinks = [
  { label: "System Status: Operational", href: "#" },
  { label: "API Docs", href: "#" },
  { label: "Internal Wiki", href: "#" },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-svh bg-canvas">
        <StaffSidebar />

        {/* pt-14 clears the fixed mobile nav bar the sidebar renders below `lg`. */}
        <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
          {/* Clearance for the floating timer, which is ~13rem tall and would
              otherwise sit on top of whatever the page renders last. */}
          <div className="flex-1 pb-56 sm:pb-44">{children}</div>

          <footer className="mt-auto flex flex-col items-center justify-between gap-3 border-t border-line-subtle px-5 py-4 text-xs text-ink-tertiary sm:flex-row lg:px-8">
            <span>© {new Date().getFullYear()} Nexus Digital Agency. Performance optimized.</span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {statusLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </footer>
        </div>

        {/* Persistent across every /staff/* route — it lives in the layout, so
            navigating between boards never resets the running timer. */}
        <FloatingTimer />
      </div>
    </TooltipProvider>
  );
}
