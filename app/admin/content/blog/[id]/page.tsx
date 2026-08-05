import { redirect } from "next/navigation";

/**
 * A blog post is a page. Editing one opens the page builder — the single
 * editor — rather than a second one that would have to reimplement drafts,
 * versions, media and publishing.
 */
export default async function AdminBlogEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/content/pages/${id}`);
}
