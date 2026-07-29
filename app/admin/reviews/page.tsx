import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return <RouteScaffold title="Reviews" route="/admin/reviews" />;
}
