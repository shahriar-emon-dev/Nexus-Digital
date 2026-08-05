"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { createPage } from "@/lib/supabase/page-actions";

/** Slugifies the name so an editor never has to think about URL shape. */
const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function CreateCaseStudyButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const finalSlug = touched ? slugify(slug) : slugify(name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData();
    data.set("title", name.trim());
    // The case-studies/ prefix is applied rather than asked for: a case study
    // that lives anywhere else is not a case study.
    data.set("slug", `case-studies/${finalSlug}`);
    data.set("pageType", "case-study");
    data.set("templateId", "case-study");

    const result = await createPage(data);
    if ("error" in result) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.push(`/admin/content/pages/${result.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        New case study
      </Button>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a case study</DialogTitle>
            <DialogDescription>
              This creates a draft page with the case study structure. Nothing is
              public until you publish it.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-name">Client or project</Label>
              <Input
                id="cs-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Northwind Retail replatform"
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-slug">URL</Label>
              <Input
                id="cs-slug"
                value={touched ? slug : finalSlug}
                onChange={(e) => {
                  setTouched(true);
                  setSlug(e.target.value);
                }}
              />
              <p className="text-xs text-ink-tertiary">
                Will publish at{" "}
                <code className="font-mono">/case-studies/{finalSlug || "…"}</code>
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!name.trim() || !finalSlug || busy}>
              {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Plus />}
              Create case study
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
