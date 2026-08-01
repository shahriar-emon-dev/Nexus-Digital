import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { canEditMedia, listMedia } from "@/lib/supabase/media-actions";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = {
  title: "Media Library",
  description: "Images, video and documents used across the public site.",
};

export default async function AdminMediaPage() {
  const [assets, canEdit] = await Promise.all([listMedia(), canEditMedia()]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Content", href: "/admin/content/pages" },
          { label: "Media" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Media Library
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every image, video and document the public site can reference. Alt text
          lives here rather than on each page, so a description written once is
          correct everywhere the asset appears.
        </p>
      </header>

      <MediaLibrary initialAssets={assets} canEdit={canEdit} />
    </div>
  );
}
