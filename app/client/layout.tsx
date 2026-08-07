import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { getSidebarUser } from "@/lib/supabase/sidebar-user";
import { getClientAccount } from "@/lib/supabase/account-queries";
import { getClientSidebarCounts } from "@/lib/supabase/portal-counts";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  // Resolved here rather than inside the sidebar: it is a client component, and
  // the badges are per-user figures that must not be baked into the bundle.
  const [user, account, counts] = await Promise.all([
    getSidebarUser("Client"),
    getClientAccount(),
    getClientSidebarCounts(),
  ]);

  return (
    <TooltipProvider>
      <div className="flex min-h-svh bg-canvas">
        <ClientSidebar
          user={user}
          account={account ? { name: account.name, tier: account.tier } : null}
          counts={counts}
        />
        {/* pt-14 clears the fixed mobile nav bar the sidebar renders below `lg`. */}
        <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">{children}</div>
      </div>
    </TooltipProvider>
  );
}
