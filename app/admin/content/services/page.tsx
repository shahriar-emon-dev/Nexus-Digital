import { redirect } from "next/navigation";

/**
 * There were two service management screens: this one and the Services
 * Catalog. Both listed the same concept from different shapes, and nothing
 * told an editor which one a published service page had come from.
 *
 * The Catalog is now the single implementation — it reads the same service
 * pages this screen did, and adds the price, category and lead time fields
 * that only lived in the other system. Both navigation entries still work;
 * there is one screen behind them.
 */
export default function AdminContentServicesPage() {
  redirect("/admin/services");
}
