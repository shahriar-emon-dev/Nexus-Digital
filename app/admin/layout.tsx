import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getSidebarUser } from "@/lib/supabase/sidebar-user";
import { getMyProfile } from "@/lib/supabase/profile-actions";
import { getGrantsForRole } from "@/lib/supabase/nav-permissions";
import { getCommandBarMetrics } from "@/lib/supabase/metrics-queries";
import { getSidebarTelemetry } from "@/lib/supabase/infrastructure-queries";
import { AdminCommandBar } from "@/components/layout/AdminCommandBar";
import { SystemStatusDock } from "@/components/admin/SystemStatusDock";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, profile] = await Promise.all([
    getSidebarUser("Administrator"),
    getMyProfile(),
  ]);

  // Only show what this role can actually open — the guard would bounce the
  // rest, and a menu of dead ends is worse than a shorter menu. Grants cross
  // as plain data; the sidebar filters, because nav icons are components.
  const grants = await getGrantsForRole(profile?.role_id ?? null);

  // Derived from invoice_totals, so the bar cannot contradict the billing data
  // it sits above. Refreshed over realtime by the bar itself.
  const metrics = await getCommandBarMetrics();

  // Connection pressure and buffer cache hits, measured by Postgres. Returns
  // null for a role that cannot read the statistics, and the badges then show
  // a dash rather than inventing a reading.
  const telemetry = await getSidebarTelemetry();

  return (
    <TooltipProvider>
      <div className="flex min-h-svh bg-canvas">
        <AdminSidebar user={user} grants={grants} telemetry={telemetry} />

        {/* pt-14 clears the fixed mobile nav bar the sidebar renders below `lg`. */}
        <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
          <AdminCommandBar metrics={metrics} />
          {/* Bottom padding keeps the floating status dock off the page content. */}
          <div className="flex-1 pb-44 sm:pb-36">{children}</div>
        </div>

        <SystemStatusDock connectionPct={telemetry?.connectionPct ?? null} />
      </div>
    </TooltipProvider>
  );
}
