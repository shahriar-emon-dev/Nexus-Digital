import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { PageBlock } from "@/lib/supabase/page-actions";
import { getCaseStudy } from "@/lib/supabase/content-queries";

type Props = { params: { slug: string } };

/**
 * A case study is a published CMS page.
 *
 * The static module this replaces described four fictional clients with
 * invented results ("420% Throughput Increase" for a bank that does not exist).
 * Those were not migrated — a case study is a claim about work actually done,
 * and the honest source is a real project with `case_study_page_id` set.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getCaseStudy(params.slug);
  if (!study) return { title: "Case study not found" };

  const seo = study.seo as { title?: string; description?: string };
  return {
    title: seo.title || study.title,
    description: seo.description || study.excerpt || undefined,
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const study = await getCaseStudy(params.slug);
  if (!study) notFound();

  return (
    <main>
      <BlockRenderer blocks={study.blocks as PageBlock[]} />
    </main>
  );
}
