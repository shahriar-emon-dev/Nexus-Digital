"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createPage } from "@/lib/supabase/page-actions";

/**
 * Creates the homepage as an ordinary CMS page.
 *
 * It is deliberately NOT assigned to the root here. Publishing and assigning
 * are separate decisions, so building a homepage cannot replace the live one
 * by accident — the editor assigns it from Navigation once it is ready.
 */
export function CreateHomepageButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);

    const data = new FormData();
    data.set("title", "Homepage");
    data.set("slug", "home");
    data.set("templateId", "product-launch");

    const result = await createPage(data);
    if ("error" in result) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.push(`/admin/content/pages/${result.id}`);
  }

  return (
    <span className="flex flex-col items-center gap-2">
      <Button size="sm" onClick={create} disabled={busy}>
        {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Plus />}
        {busy ? "Creating…" : "Build a CMS homepage"}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}
