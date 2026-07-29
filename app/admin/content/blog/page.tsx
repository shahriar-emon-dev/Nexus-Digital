import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Blog" };

export default function AdminContentBlogPage() {
  return <RouteScaffold title="Blog" route="/admin/content/blog" />;
}
