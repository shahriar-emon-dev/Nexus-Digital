import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Case Studies detail" };

export default function CaseStudiesPage() {
  return <RouteScaffold title="Case Studies detail" route="/case-studies/[slug]" />;
}
