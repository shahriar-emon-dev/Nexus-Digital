import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Blog detail" };

export default function AdminContentBlogPage() {
  return <RouteScaffold title="Blog detail" route="/admin/content/blog/[id]" />;
}
