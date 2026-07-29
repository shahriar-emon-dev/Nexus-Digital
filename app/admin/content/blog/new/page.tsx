import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "New Blog" };

export default function AdminContentBlogNewPage() {
  return <RouteScaffold title="New Blog" route="/admin/content/blog/new" />;
}
