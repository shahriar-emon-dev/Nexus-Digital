import { redirect } from "next/navigation";

/**
 * The Help section's "Logs" and Operations' "Audit Logs" were two entry points
 * to the same thing. Rather than build a second viewer that drifts from the
 * first, this route redirects — the menu item keeps working and there is one
 * implementation to maintain.
 *
 * This is not the place for raw application logs: those live in the hosting
 * platform's own console, and mirroring them here would mean claiming a
 * retention guarantee this database does not offer.
 */
export default function AdminLogsPage() {
  redirect("/admin/audit-logs");
}
