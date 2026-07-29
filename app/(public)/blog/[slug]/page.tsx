import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Blog detail" };

export default function BlogPage() {
  return <RouteScaffold title="Blog detail" route="/blog/[slug]" />;
}
