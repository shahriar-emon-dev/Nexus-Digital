"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";

import {
  deleteProjectFile,
  uploadProjectFile,
  type ProjectFile,
} from "@/lib/supabase/file-actions";
import { useRealtime } from "@/lib/supabase/use-realtime";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Bytes as something a person reads, without pretending to more precision. */
const size = (bytes: number | null) => {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Project file sharing, used by both portals.
 *
 * `canUpload` follows the same rule as the support workspace: it decides what
 * is offered, not what is permitted. The insert policy requires the caller to
 * be able to see the project and pins `uploaded_by` to them.
 */
export function FileLibrary({
  files,
  projects,
  canUpload,
}: {
  files: ProjectFile[];
  projects: { id: string; name: string }[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  useRealtime("shared:files", [{ table: "project_files" }], () => router.refresh());

  function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await uploadProjectFile(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {canUpload && projects.length > 0 && (
        <Card variant="glass" className="gap-4 rounded-2xl p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Share a file</h2>
          <form ref={formRef} onSubmit={onUpload} className="flex flex-wrap items-end gap-4">
            {error && (
              <p role="alert" className="w-full text-[0.875rem] text-danger">
                {error}
              </p>
            )}

            <div className="flex min-w-48 flex-1 flex-col gap-1.5">
              <label htmlFor="projectId" className="text-[0.8125rem] font-medium text-ink">
                Project
              </label>
              <select
                id="projectId"
                name="projectId"
                required
                className="h-11 rounded-lg border border-line bg-surface px-3 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-48 flex-1 flex-col gap-1.5">
              <label htmlFor="file" className="text-[0.8125rem] font-medium text-ink">
                File (25 MB max)
              </label>
              <input
                id="file"
                name="file"
                type="file"
                required
                className="h-11 rounded-lg border border-line bg-surface px-3 py-2 text-[0.875rem] text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-1 file:text-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              />
            </div>

            <Button type="submit" className="rounded-xl" disabled={pending}>
              {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Upload />}
              Upload
            </Button>
          </form>
        </Card>
      )}

      {files.length === 0 ? (
        <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
          <FileText className="size-8 text-ink-tertiary" aria-hidden />
          <h2 className="font-heading text-xl font-semibold text-ink">No files yet</h2>
          <p className="max-w-sm text-ink-tertiary">
            Anything shared on a project you can see will appear here.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li key={file.id}>
              <Card variant="glass" className="flex-row items-center gap-4 rounded-xl p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <FileText className="size-5" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="truncate rounded-sm font-medium text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none"
                  >
                    {file.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <p className="text-[0.75rem] text-ink-tertiary">
                    {file.projectName ?? "No project"} · {size(file.size_bytes)} ·{" "}
                    {file.uploadedByName ?? "someone"}
                  </p>
                </div>

                {canUpload && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${file.name}`}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteProjectFile(file.id);
                        router.refresh();
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
