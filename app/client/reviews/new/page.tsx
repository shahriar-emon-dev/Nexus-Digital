import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "New Review" };

export default function ClientReviewsNewPage() {
  return <RouteScaffold title="New Review" route="/client/reviews/new" />;
}
