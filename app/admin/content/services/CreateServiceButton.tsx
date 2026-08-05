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

export function CreateServiceButton() {
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
    // The services/ prefix is applied here rather than asked for: a service
    // that lives anywhere else is not a service.
    data.set("slug", `services/${finalSlug}`);
    data.set("pageType", "service");
    data.set("templateId", "service");

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
        New service
      </Button>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a service</DialogTitle>
            <DialogDescription>
              This creates a draft page with the service structure. Nothing is
              public until you publish it.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-name">Service name</Label>
              <Input
                id="svc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Performance Marketing"
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-slug">URL</Label>
              <Input
                id="svc-slug"
                value={touched ? slug : finalSlug}
                onChange={(e) => {
                  setTouched(true);
                  setSlug(e.target.value);
                }}
              />
              <p className="text-xs text-ink-tertiary">
                Will publish at{" "}
                <code className="font-mono">/services/{finalSlug || "…"}</code>
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!name.trim() || !finalSlug || busy}>
              {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Plus />}
              Create service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
