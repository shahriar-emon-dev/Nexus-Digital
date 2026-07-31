"use client";

import { PortalError } from "@/components/shared/PortalStates";

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalError {...props} portalLabel="the command center" portalHref="/admin" />;
}
