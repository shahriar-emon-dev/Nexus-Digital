"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Search,
  Shapes,
  Trash2,
  Upload,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  deleteMedia,
  updateMedia,
  uploadMedia,
  type MediaAsset,
} from "@/lib/supabase/media-actions";
import { cn } from "@/lib/utils";

const kindIcon = {
  image: ImageIcon,
  video: Film,
  document: FileText,
  logo: Shapes,
} as const;

const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`;

export function MediaLibrary({
  initialAssets,
  canEdit,
}: {
  initialAssets: MediaAsset[];
  /** Read-only mode for roles without a content-publishing grant. */
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [assets, setAssets] = React.useState(initialAssets);
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [editing, setEditing] = React.useState<MediaAsset | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setAssets(initialAssets), [initialAssets]);

  /** An upload in another tab, or by another editor, appears here immediately. */
  useRealtime("admin:media", [{ table: "media_assets" }], () => router.refresh());

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (kind !== "all" && a.kind !== kind) return false;
      if (!q) return true;
      return (
        a.filename.toLowerCase().includes(q) ||
        (a.title ?? "").toLowerCase().includes(q) ||
        (a.alt_text ?? "").toLowerCase().includes(q) ||
        a.folder.toLowerCase().includes(q)
      );
    });
  }, [assets, query, kind]);

  const missingAlt = assets.filter((a) => a.kind !== "document" && a.alt_text === null).length;

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
    router.refresh();
    toast.add({ title: "Upload complete", type: "success" });
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const result = await updateMedia(editing.id, new FormData(e.currentTarget));
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setEditing(null);
    router.refresh();
    toast.add({ title: "Details saved", type: "success" });
  }

  async function remove(asset: MediaAsset) {
    const previous = assets;
    setAssets((a) => a.filter((x) => x.id !== asset.id));
    const result = await deleteMedia(asset.id);
    if ("error" in result) {
      setAssets(previous);
      setError(result.error);
      return;
    }
    setEditing(null);
    router.refresh();
    toast.add({ title: `${asset.filename} deleted`, type: "info" });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alt text is an accessibility obligation, so an outstanding count is
          surfaced rather than left for an audit to find later. */}
      {missingAlt > 0 && (
        <Alert tone="warning">
          <AlertDescription>
            {missingAlt} {missingAlt === 1 ? "asset has" : "assets have"} no alt text yet. Screen
            readers will announce the filename instead.
          </AlertDescription>
        </Alert>
      )}

      {canEdit && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files);
          }}
          className={cn(
            "rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-brand bg-brand-subtle/40" : "border-line-strong bg-surface-sunken/40"
          )}
        >
          <Upload className="mx-auto mb-3 size-6 text-ink-tertiary" aria-hidden />
          <p className="text-sm text-ink">Drop files here, or</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Upload />}
            {uploading ? "Uploading…" : "Choose files"}
          </Button>
          <p className="mt-3 text-xs text-ink-tertiary">
            PNG, JPEG, WebP, AVIF, GIF, SVG, MP4, WebM or PDF. 25 MB maximum.
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            aria-label="Choose files to upload"
            onChange={(e) => upload(e.target.files)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename, title, alt text or folder…"
            aria-label="Search media"
            className="pl-9"
          />
        </div>
        <Select value={kind} onValueChange={(v) => setKind(v as string)}>
          <SelectTrigger className="w-40" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="logo">Logos / SVG</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-ink-tertiary" aria-live="polite">
          {visible.length} of {assets.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={assets.length === 0 ? "No media yet" : "No matches"}
          description={
            assets.length === 0
              ? canEdit
                ? "Upload an image, video or document to get started."
                : "Nothing has been uploaded yet."
              : "No asset matches that search and filter."
          }
          action={
            assets.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setKind("all");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((a) => {
            const Icon = kindIcon[a.kind];
            const noAlt = a.kind !== "document" && a.alt_text === null;
            return (
              <li key={a.id}>
                <Card className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => canEdit && setEditing(a)}
                    disabled={!canEdit}
                    className="block w-full text-left focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:cursor-default"
                  >
                    <span className="relative flex aspect-4/3 items-center justify-center bg-surface-sunken">
                      {a.kind === "image" || a.kind === "logo" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary
                        // external storage host; next/image would need a remote pattern
                        // per deployment, which the CMS cannot know ahead of time.
                        <img
                          src={a.public_url}
                          alt={a.alt_text ?? ""}
                          loading="lazy"
                          width={a.width ?? undefined}
                          height={a.height ?? undefined}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Icon className="size-8 text-ink-tertiary" aria-hidden />
                      )}
                      {noAlt && (
                        <span className="absolute top-2 right-2">
                          <Badge variant="warning" size="sm">
                            <AlertTriangle aria-hidden />
                            No alt
                          </Badge>
                        </span>
                      )}
                    </span>
                    <CardContent className="p-3">
                      <span className="block truncate text-sm font-medium text-ink">{a.filename}</span>
                      <span className="mt-0.5 block text-xs text-ink-tertiary">
                        {formatBytes(a.size_bytes)}
                        {a.width && a.height ? ` · ${a.width}×${a.height}` : ""}
                      </span>
                    </CardContent>
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form onSubmit={save}>
              <DialogHeader>
                <DialogTitle>{editing.filename}</DialogTitle>
                <DialogDescription>
                  {formatBytes(editing.size_bytes)} · {editing.mime_type}
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="altText">Alt text</Label>
                  <Textarea
                    id="altText"
                    name="altText"
                    rows={2}
                    maxLength={300}
                    defaultValue={editing.alt_text ?? ""}
                  />
                  <p className="text-xs text-ink-tertiary">
                    Describe what the image conveys. Leave empty only if it is purely
                    decorative — an empty value tells screen readers to skip it.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" maxLength={200} defaultValue={editing.title ?? ""} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    name="caption"
                    rows={2}
                    maxLength={600}
                    defaultValue={editing.caption ?? ""}
                  />
                </div>
              </DialogBody>
              <DialogFooter className="justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => remove(editing)}
                >
                  <Trash2 />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
