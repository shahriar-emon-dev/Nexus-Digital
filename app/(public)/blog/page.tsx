import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return <RouteScaffold title="Blog" route="/blog" />;
}
