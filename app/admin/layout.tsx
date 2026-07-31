import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getSidebarUser } from "@/lib/supabase/sidebar-user";
import { AdminCommandBar } from "@/components/layout/AdminCommandBar";
import { SystemStatusDock } from "@/components/admin/SystemStatusDock";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSidebarUser("Administrator");

  return (
    <TooltipProvider>
      <div className="flex min-h-svh bg-canvas">
        <AdminSidebar user={user} />

        {/* pt-14 clears the fixed mobile nav bar the sidebar renders below `lg`. */}
        <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
          <AdminCommandBar />
          {/* Bottom padding keeps the floating status dock off the page content. */}
          <div className="flex-1 pb-44 sm:pb-36">{children}</div>
        </div>

        <SystemStatusDock />
      </div>
    </TooltipProvider>
  );
}
