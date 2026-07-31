"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Monitor,
  Plus,
  Redo2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  sectionCatalogue,
  sectionMeta,
  serviceById,
  serviceStatusTone,
  type Service,
  type ServiceSection,
} from "@/lib/services";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const viewports = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "48rem" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "23.4375rem" },
] as const;

/**
 * Service page editor.
 *
 * Structure list, canvas and the settings panel all read one `sections` array,
 * so hiding or reordering a section is reflected everywhere at once. The source
 * had three independent static mockups that could not agree with each other.
 */
export function ServiceEditor({ serviceId }: { serviceId: string }) {
  const source = serviceById(serviceId)!;

  const [service, setService] = React.useState<Service>(source);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    source.sections[0]?.id ?? null
  );
  const [viewport, setViewport] = React.useState<(typeof viewports)[number]["id"]>("desktop");
  const [notice, setNotice] = React.useState<string | null>(null);

  // Undo history. The source had undo/redo buttons wired to nothing.
  const [past, setPast] = React.useState<Service[]>([]);
  const [future, setFuture] = React.useState<Service[]>([]);

  function commit(next: Service) {
    setPast((p) => [...p, service]);
    setFuture([]);
    setService(next);
    setNotice(null);
  }

  function undo() {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [service, ...f]);
      setService(previous);
      return p.slice(0, -1);
    });
  }

  function redo() {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, service]);
      setService(next);
      return f.slice(1);
    });
  }

  const selected = service.sections.find((s) => s.id === selectedId) ?? null;
  const visible = service.sections.filter((s) => s.visible);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= service.sections.length) return;
    const sections = [...service.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    commit({ ...service, sections });
  }

  function toggleVisible(id: string) {
    commit({
      ...service,
      sections: service.sections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    });
  }

  function remove(id: string) {
    commit({ ...service, sections: service.sections.filter((s) => s.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }

  function duplicate(id: string) {
    const index = service.sections.findIndex((s) => s.id === id);
    const original = service.sections[index];
    if (!original) return;
    const copy: ServiceSection = {
      ...original,
      id: `${original.id}-copy-${Date.now()}`,
    };
    const sections = [...service.sections];
    sections.splice(index + 1, 0, copy);
    commit({ ...service, sections });
    setSelectedId(copy.id);
  }

  function addSection(kind: ServiceSection["kind"]) {
    const copy: ServiceSection = {
      id: `new-${Date.now()}`,
      kind,
      variant: "Default",
      visible: true,
    };
    commit({ ...service, sections: [...service.sections, copy] });
    setSelectedId(copy.id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-[calc(100svh-5rem)] lg:flex-none lg:overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Button variant="ghost" size="sm" render={<Link href="/admin/services" />}>
            <ArrowLeft />
            Services
          </Button>
          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-heading text-[1.0625rem] leading-tight font-bold text-brand">
              {service.name}
            </p>
            <p className="flex items-center gap-2">
              <Badge variant={serviceStatusTone[service.status]} size="sm">
                {service.status}
              </Badge>
              <span className="font-mono text-[0.6875rem] text-ink-tertiary">
                /services/{service.slug}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-sunken p-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Undo"
                    disabled={past.length === 0}
                    onClick={undo}
                  >
                    <Undo2 />
                  </Button>
                }
              />
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Redo"
                    disabled={future.length === 0}
                    onClick={redo}
                  >
                    <Redo2 />
                  </Button>
                }
              />
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>

          <div
            role="group"
            aria-label="Preview width"
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-sunken p-1"
          >
            {viewports.map((v) => (
              <Tooltip key={v.id}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={v.label}
                      aria-pressed={viewport === v.id}
                      onClick={() => setViewport(v.id)}
                      className={cn(viewport === v.id && "bg-surface text-brand")}
                    >
                      <v.icon />
                    </Button>
                  }
                />
                <TooltipContent>{v.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => setNotice("preview")}>
            <Eye />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => setNotice("publish")}
            className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
          >
            Publish
          </Button>
        </div>
      </div>

      {notice && (
        <div className="border-b border-line p-4 lg:px-6">
          <Alert tone="warning">
            <AlertTitle>Nothing was published</AlertTitle>
            <AlertDescription>
              {/* TODO: PUT to the services API, then revalidate /services/[slug]. */}
              The services API is not connected, so /services/{service.slug} is
              unchanged. Your edits are local to this session.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        {/* ── Structure ─────────────────────────────────────────────────── */}
        <section
          aria-label="Page structure"
          className="scrollbar-none flex min-h-0 shrink-0 flex-col overflow-y-auto border-line xl:w-72 xl:border-r"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="text-[0.6875rem] font-bold tracking-widest text-ink-tertiary uppercase">
              Structure
            </h2>
            <span data-tabular className="text-[0.6875rem] text-ink-tertiary">
              {service.sections.length}
            </span>
          </div>

          <ol className="flex flex-col gap-2 p-3">
            {service.sections.map((section, i) => {
              const meta = sectionMeta(section.kind);
              const active = selectedId === section.id;
              return (
                <li key={section.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-2.5",
                      "transition-[border-color,background-color,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
                      "hover:translate-x-0.5",
                      active
                        ? "border-brand-line bg-brand-subtle"
                        : "border-line bg-surface-sunken hover:border-line-strong",
                      !section.visible && "opacity-60"
                    )}
                  >
                    {/* Buttons, not drag: the source's `cursor-grab` had no
                        handler, and pointer dragging excludes keyboard users. */}
                    <div className="flex shrink-0 flex-col">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Move ${meta.name} up`}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Move ${meta.name} down`}
                        disabled={i === service.sections.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ChevronDown />
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedId(section.id)}
                      aria-pressed={active}
                      className="min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "block truncate text-[0.8125rem] font-semibold",
                          active ? "text-brand" : "text-ink"
                        )}
                      >
                        {meta.name}
                      </span>
                      <span className="block truncate text-[0.625rem] tracking-tight text-ink-tertiary uppercase">
                        {section.variant}
                      </span>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${section.visible ? "Hide" : "Show"} ${meta.name}`}
                      aria-pressed={section.visible}
                      onClick={() => toggleVisible(section.id)}
                    >
                      {section.visible ? <Eye /> : <EyeOff />}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="border-t border-line p-3">
            <details className="group">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-2.5",
                  "text-[0.8125rem] font-semibold text-ink-tertiary transition-colors",
                  "hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                )}
              >
                <Plus className="size-4" aria-hidden />
                Add section
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {sectionCatalogue.map((meta) => (
                  <li key={meta.kind}>
                    <button
                      type="button"
                      onClick={() => addSection(meta.kind)}
                      className="w-full rounded-lg px-3 py-2 text-left text-[0.8125rem] text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    >
                      {meta.name}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        {/* ── Canvas ────────────────────────────────────────────────────── */}
        <section
          aria-label="Preview"
          className="scrollbar-none min-h-0 min-w-0 flex-1 overflow-y-auto bg-canvas p-4 lg:p-8"
        >
          <div
            className="mx-auto flex flex-col gap-5 transition-[max-width] duration-(--duration-slow) ease-(--ease-out-quint)"
            style={{ maxWidth: viewports.find((v) => v.id === viewport)!.width }}
          >
            {visible.map((section) => (
              <SectionPreview
                key={section.id}
                section={section}
                active={selectedId === section.id}
                onSelect={() => setSelectedId(section.id)}
              />
            ))}

            {visible.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-line px-6 py-20 text-center text-ink-tertiary">
                Every section is hidden.
              </p>
            )}
          </div>
        </section>

        {/* ── Settings ──────────────────────────────────────────────────── */}
        {selected && (
          <aside
            aria-label="Section settings"
            className="scrollbar-none flex min-h-0 shrink-0 flex-col gap-6 overflow-y-auto border-line p-5 xl:w-80 xl:border-l"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[0.6875rem] font-bold tracking-widest text-brand uppercase">
                Section settings
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close settings"
                onClick={() => setSelectedId(null)}
              >
                <X />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                Section
              </span>
              <p className="font-heading text-lg font-semibold text-ink">
                {sectionMeta(selected.kind).name}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="section-variant"
                className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
              >
                Layout note
              </label>
              <Input
                id="section-variant"
                value={selected.variant}
                onChange={(e) =>
                  setService((s) => ({
                    ...s,
                    sections: s.sections.map((x) =>
                      x.id === selected.id ? { ...x, variant: e.target.value } : x
                    ),
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="service-summary"
                className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
              >
                Service summary
              </label>
              <Textarea
                id="service-summary"
                rows={4}
                value={service.summary}
                onChange={(e) => setService((s) => ({ ...s, summary: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line-subtle pt-4">
              <span className="text-[0.8125rem] text-ink-secondary">Visible on the page</span>
              <Switch
                checked={selected.visible}
                onCheckedChange={() => toggleVisible(selected.id)}
                aria-label={`${selected.visible ? "Hide" : "Show"} this section`}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => duplicate(selected.id)}
              >
                <Copy />
                Duplicate
              </Button>
              {/* A required section has no delete control rather than one that
                  silently refuses. */}
              {!sectionMeta(selected.kind).required && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-danger"
                  onClick={() => remove(selected.id)}
                >
                  <Trash2 />
                  Delete
                </Button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function SectionPreview({
  section,
  active,
  onSelect,
}: {
  section: ServiceSection;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = sectionMeta(section.kind);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group w-full rounded-2xl border p-6 text-left",
        "transition-[border-color,transform] duration-(--duration-normal) ease-(--ease-out-quint)",
        "hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
        active ? "border-brand ring-1 ring-brand-line" : "border-line hover:border-line-strong",
        "glass"
      )}
    >
      <span className="mb-4 flex items-center justify-between gap-3">
        <span
          className={cn(
            "text-[0.625rem] font-bold tracking-widest uppercase",
            active ? "text-brand" : "text-ink-tertiary"
          )}
        >
          {meta.name}
        </span>
        <span className="text-[0.625rem] text-ink-tertiary">{section.variant}</span>
      </span>

      {section.kind === "hero" && (
        <span className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="block h-2.5 w-28 rounded-full bg-brand/40" />
          <span className="block h-7 w-3/4 rounded-lg bg-ink/20" />
          <span className="block h-3 w-2/3 rounded bg-ink/10" />
          <span className="mt-2 flex gap-3">
            <span className="block h-9 w-36 rounded-lg bg-brand/60" />
            <span className="block h-9 w-28 rounded-lg border border-line" />
          </span>
        </span>
      )}

      {(section.kind === "features" || section.kind === "caseStudies") && (
        <span className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex flex-col gap-2 rounded-xl bg-surface-sunken p-4">
              <span className="block size-8 rounded-lg bg-brand/25" />
              <span className="block h-2.5 w-2/3 rounded bg-ink/20" />
              <span className="block h-2 w-full rounded bg-ink/10" />
            </span>
          ))}
        </span>
      )}

      {section.kind === "overview" && (
        <span className="grid grid-cols-2 items-center gap-4">
          <span className="flex flex-col gap-2">
            <span className="block h-4 w-2/3 rounded bg-ink/20" />
            <span className="block h-2 w-full rounded bg-ink/10" />
            <span className="block h-2 w-5/6 rounded bg-ink/10" />
          </span>
          <span className="block h-24 rounded-xl bg-surface-sunken" />
        </span>
      )}

      {section.kind === "pricing" && (
        <span className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-3",
                i === 1 ? "bg-brand-subtle ring-1 ring-brand-line" : "bg-surface-sunken"
              )}
            >
              <span className="block h-2 w-10 rounded bg-ink/20" />
              <span className="block h-5 w-14 rounded bg-ink/25" />
              <span className="block h-7 w-full rounded bg-brand/40" />
            </span>
          ))}
        </span>
      )}

      {section.kind === "faq" && (
        <span className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-9 rounded-lg bg-surface-sunken" />
          ))}
        </span>
      )}

      {section.kind === "cta" && (
        <span className="flex flex-col items-center gap-3 rounded-xl bg-brand-subtle p-6">
          <span className="block h-4 w-1/2 rounded bg-ink/20" />
          <span className="block h-9 w-32 rounded-lg bg-brand/60" />
        </span>
      )}
    </button>
  );
}
