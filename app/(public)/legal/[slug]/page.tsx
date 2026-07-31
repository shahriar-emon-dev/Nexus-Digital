import type { Metadata } from "next";
import { notFound } from "next/navigation";


import { legalBySlug, legalDocuments } from "@/lib/legal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return legalDocuments.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const doc = legalBySlug(params.slug);
  if (!doc) return { title: "Not found" };
  return { title: doc.title, description: doc.summary };
}

const longDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function LegalPage({ params }: Props) {
  const doc = legalBySlug(params.slug);
  if (!doc) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
      <header className="mb-12">
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-balance text-ink md:text-[3rem]">
          {doc.title}
        </h1>
        <p className="mt-4 text-lg text-ink-secondary">{doc.summary}</p>
        <p className="mt-4 text-[0.8125rem] text-ink-tertiary">
          Last updated{" "}
          <time dateTime={doc.updatedAt}>
            {longDate.format(new Date(doc.updatedAt))}
          </time>
        </p>
      </header>

      {/* Stated plainly rather than implied — this wording has not been through
          legal review, and saying so is more useful than pretending otherwise. */}
      <Alert tone="info" className="mb-12">
        <AlertTitle>Placeholder wording</AlertTitle>
        <AlertDescription>
          This document describes how the platform actually behaves, but it has
          not been reviewed by a lawyer. Replace it with counsel-approved wording
          before launch.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-10">
        {doc.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-semibold text-ink">
              {section.heading}
            </h2>
            {section.body.map((para) => (
              <p key={para} className="leading-relaxed text-ink-secondary">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
