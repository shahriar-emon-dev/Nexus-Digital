import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { serviceById, services } from "@/lib/services";
import { ServiceEditor } from "./ServiceEditor";

type Params = { params: { id: string } };

export function generateStaticParams() {
  return services.map((service) => ({ id: service.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const service = serviceById(params.id);
  return { title: service ? `Edit ${service.name}` : "Service not found" };
}

export default function AdminServiceEditorPage({ params }: Params) {
  const service = serviceById(params.id);
  if (!service) notFound();

  return <ServiceEditor serviceId={service.id} />;
}
