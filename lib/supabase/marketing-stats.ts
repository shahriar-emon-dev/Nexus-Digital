import { createClient } from "./server";

/**
 * Headline figures for the public homepage.
 *
 * These were four literals: "99% Uptime SLA", "12M+ Daily API requests",
 * "250+ Project deliveries" and a "4.9/5 Client rating". None was measured
 * anywhere, and two of them are the kind of claim a prospect could reasonably
 * ask the agency to evidence.
 *
 * Each figure below is counted from a table. A stat with nothing behind it is
 * OMITTED rather than rendered as zero — "0 projects delivered" is worse than
 * saying nothing, and padding the row back to four would just reintroduce the
 * problem in a new form. The homepage renders whatever it is given.
 */

export type MarketingStat = {
  value: number;
  suffix: string;
  label: string;
  decimalPlaces?: number;
  tone: "brand" | "ion" | "orchid" | "ink";
};

export async function getMarketingStats(): Promise<MarketingStat[]> {
  const supabase = await createClient();

  const [{ count: delivered }, { count: clients }, { count: services }, { data: reviews }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "Completed"),
      supabase.from("organizations").select("id", { count: "exact", head: true }),
      // Anon sees only published services, which is exactly what should be counted.
      supabase.from("service_details").select("page_id", { count: "exact", head: true }),
      supabase.from("reviews").select("rating").eq("status", "approved"),
    ]);

  const stats: MarketingStat[] = [];

  if ((delivered ?? 0) > 0) {
    stats.push({
      value: delivered!,
      suffix: "",
      label: delivered === 1 ? "Project delivered" : "Projects delivered",
      tone: "brand",
    });
  }

  if ((clients ?? 0) > 0) {
    stats.push({
      value: clients!,
      suffix: "",
      label: clients === 1 ? "Client organisation" : "Client organisations",
      tone: "ion",
    });
  }

  if ((services ?? 0) > 0) {
    stats.push({
      value: services!,
      suffix: "",
      label: services === 1 ? "Service line" : "Service lines",
      tone: "orchid",
    });
  }

  const rated = (reviews ?? []).filter((r) => typeof r.rating === "number");
  if (rated.length > 0) {
    const mean = rated.reduce((sum, r) => sum + (r.rating as number), 0) / rated.length;
    stats.push({
      value: Math.round(mean * 10) / 10,
      suffix: "/5",
      decimalPlaces: 1,
      // Named so the sample size is visible rather than implied.
      label: `Average of ${rated.length} client ${rated.length === 1 ? "review" : "reviews"}`,
      tone: "ink",
    });
  }

  return stats;
}
