import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { getSidebarUser } from "@/lib/supabase/sidebar-user";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getSidebarUser("Client");

  return (
    <TooltipProvider>
      <div className="flex min-h-svh bg-canvas">
        <ClientSidebar user={user} />
        {/* pt-14 clears the fixed mobile nav bar the sidebar renders below `lg`. */}
        <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">{children}</div>
      </div>
    </TooltipProvider>
  );
}
