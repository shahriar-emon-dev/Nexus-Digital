import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-svh bg-canvas">
        <ClientSidebar />
        {/* pt-14 clears the fixed mobile nav bar the sidebar renders below `lg`. */}
        <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">{children}</div>
      </div>
    </TooltipProvider>
  );
}
