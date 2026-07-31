import LegalPage, { generateMetadata as legalMetadata } from "../legal/[slug]/page";

// /privacy is the canonical URL — it is what the footer and the signup consent link
// to — so it renders the document directly rather than redirecting.
export const metadata = legalMetadata({ params: { slug: "privacy" } });

export default function Page() {
  return <LegalPage params={{ slug: "privacy" }} />;
}
