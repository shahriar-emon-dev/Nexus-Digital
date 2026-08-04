"use client";

import * as React from "react";
import { Check, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { listMedia, uploadMedia, type MediaAsset } from "@/lib/supabase/media-actions";
import { cn } from "@/lib/utils";

/**
 * Image field backed by the media library.
 *
 * Replaces a bare "Image URL" text input. Pasting a URL meant the alt text had
 * to be retyped for every use of the same asset, and nothing stopped a link to
 * an image the platform does not host. Choosing from the library carries the
 * asset's alt text with it, so a description written once in the library is
 * correct everywhere the image appears.
 */
export function MediaField({
  value,
  alt,
  onChange,
  label = "Image",
}: {
  value: string;
  alt: string;
  /** Emits both, because selecting an asset supplies its alt text too. */
  onChange: (next: { url: string; alt: string }) => void;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>

      {value ? (
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-sunken p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- the storage host
              is configured per deployment, so a remote pattern cannot be known. */}
          <img
            src={value}
            alt={alt}
            className="size-16 shrink-0 rounded-md border border-line object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-xs text-ink-tertiary">{value}</p>
            {alt ? (
              <p className="truncate text-xs text-ink-secondary">Alt: {alt}</p>
            ) : (
              <Badge variant="warning" size="sm">
                No alt text
              </Badge>
            )}
            <div className="mt-1 flex gap-2">
              <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-danger"
                onClick={() => onChange({ url: "", alt: "" })}
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong",
            "bg-surface-sunken/40 px-4 py-6 text-sm text-ink-tertiary transition-colors",
            "hover:border-brand-line hover:text-ink",
            "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          )}
        >
          <ImageIcon className="size-4" aria-hidden />
          Choose or upload an image
        </button>
      )}

      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        onPick={(asset) => {
          onChange({ url: asset.public_url, alt: asset.alt_text ?? "" });
          setOpen(false);
        }}
      />
    </div>
  );
}

function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (asset: MediaAsset) => void;
}) {
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const rows = await listMedia();
    // Documents cannot be rendered as an image, so they are not offered here.
    setAssets(rows.filter((a) => a.kind !== "document"));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadMedia(data);
      if ("error" in result) {
        setError(`${file.name}: ${result.error}`);
        break;
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    await load();
  }

  const visible = assets.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      a.filename.toLowerCase().includes(q) ||
      (a.title ?? "").toLowerCase().includes(q) ||
      (a.alt_text ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>
            Upload from this device or pick something already in the library. The
            asset&rsquo;s alt text comes with it.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          {error && (
            <Alert tone="danger" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void upload(e.dataTransfer.files);
            }}
            className={cn(
              "rounded-xl border border-dashed px-4 py-5 text-center transition-colors",
              dragging ? "border-brand bg-brand-subtle/40" : "border-line-strong bg-surface-sunken/40"
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Upload />
              )}
              {uploading ? "Uploading…" : "Upload from this device"}
            </Button>
            <p className="mt-2 text-xs text-ink-tertiary">
              …or drop files here. PNG, JPEG, WebP, AVIF, GIF or SVG.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label="Upload an image from this device"
              onChange={(e) => void upload(e.target.files)}
            />
          </div>

          {assets.length > 0 && (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the library…"
              aria-label="Search media"
            />
          )}

          {loading ? (
            <p className="py-10 text-center text-sm text-ink-tertiary">Loading library…</p>
          ) : visible.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-tertiary">
              {assets.length === 0
                ? "The library is empty. Upload an image to get started."
                : "Nothing matches that search."}
            </p>
          ) : (
            <ul className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {visible.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onPick(a)}
                    className={cn(
                      "group block w-full overflow-hidden rounded-lg border border-line text-left",
                      "transition-colors hover:border-brand",
                      "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    )}
                  >
                    <span className="relative flex aspect-square items-center justify-center bg-surface-sunken">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.public_url}
                        alt={a.alt_text ?? ""}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                      <span className="absolute inset-0 hidden place-items-center bg-brand/20 group-hover:grid">
                        <Check className="size-6 text-brand-fg" aria-hidden />
                      </span>
                    </span>
                    <span className="block truncate px-2 py-1.5 text-xs text-ink-secondary">
                      {a.filename}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
