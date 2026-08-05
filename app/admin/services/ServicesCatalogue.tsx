"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  Search,
  Star,
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
import { StatCard } from "@/components/shared/StatCard";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  setServiceFeatured,
  updateServiceDetails,
  type CatalogueService,
} from "@/lib/supabase/service-actions";
import { cn } from "@/lib/utils";

const statusTone: Record<string, "success" | "warning" | "default"> = {
  published: "success",
  draft: "warning",
  archived: "default",
};

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const money = (value: number | null, currency: string) =>
  value === null
    ? null
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 0,
      }).format(value);

export function ServicesCatalogue({
  initial,
  categories,
}: {
  initial: CatalogueService[];
  categories: string[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [services, setServices] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [status, setStatus] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState<CatalogueService | null>(null);

  React.useEffect(() => setServices(initial), [initial]);

  // Publishing a service page changes its status here, so both tables matter.
  useRealtime(
    "admin:services",
    [{ table: "service_details" }, { table: "pages" }],
    () => router.refresh()
  );

  const summary = React.useMemo(
    () => ({
      total: services.length,
      published: services.filter((s) => s.page?.status === "published").length,
      drafts: services.filter((s) => s.page?.status === "draft").length,
      priced: services.filter((s) => s.price_from !== null).length,
    }),
    [services]
  );

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (status !== "all" && s.page?.status !== status) return false;
      if (!q) return true;
      return (
        (s.page?.title ?? "").toLowerCase().includes(q) ||
        (s.page?.slug ?? "").toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.summary ?? "").toLowerCase().includes(q)
      );
    });
  }, [services, query, category, status]);

  async function run(fn: () => Promise<{ ok: true } | { error: string }>, message: string) {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return false;
    }
    toast.add({ title: message, type: "success" });
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Services" value={String(summary.total)} icon={Boxes} />
        <StatCard label="Published" value={String(summary.published)} />
        <StatCard label="Drafts" value={String(summary.drafts)} />
        <StatCard
          label="Priced"
          value={String(summary.priced)}
          caption={
            summary.total - summary.priced > 0
              ? `${summary.total - summary.priced} without a price`
              : "Every service priced"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search service, slug or category…"
            aria-label="Search services"
            className="pl-9"
          />
        </div>

        {categories.length > 1 && (
          <Select value={category} onValueChange={(v) => setCategory(v as string)}>
            <SelectTrigger className="w-44" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} of {services.length} services.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={services.length === 0 ? "No services yet" : "No matches"}
          description={
            services.length === 0
              ? "A service is a page under /services/, edited in the page builder. Creating one here gives it the service structure and a catalogue entry in the same step."
              : "No service matches that search and filter."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[58rem] border-collapse text-left">
                <caption className="sr-only">
                  Every service with its category, price, lead time and publish state.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Service</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Category</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">From</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Lead time</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Updated</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((s) => {
                    const price = money(s.price_from === null ? null : Number(s.price_from), s.currency);
                    return (
                      <tr key={s.page_id} className="transition-colors hover:bg-surface-sunken/40">
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="flex items-center gap-2">
                            {s.is_featured && (
                              <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Featured" />
                            )}
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {s.page?.title ?? "Untitled"}
                              </span>
                              <code className="block truncate text-xs text-ink-tertiary">
                                /{s.page?.slug ?? "—"}
                              </code>
                            </span>
                          </span>
                        </th>

                        <td className="px-3 py-3">
                          <Badge variant="outline" size="sm">
                            {s.category}
                          </Badge>
                        </td>

                        <td className="px-3 py-3">
                          <Badge variant={statusTone[s.page?.status ?? "draft"] ?? "default"} size="sm">
                            {s.page?.status ?? "draft"}
                          </Badge>
                        </td>

                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink">
                          {/* A dash, not $0: an unpriced service is not free. */}
                          {price ?? <span className="text-ink-tertiary">—</span>}
                        </td>

                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {s.lead_time_weeks === null ? (
                            <span className="text-ink-tertiary">—</span>
                          ) : (
                            `${s.lead_time_weeks} wks`
                          )}
                        </td>

                        <td className="px-3 py-3 text-sm text-ink-tertiary">
                          {s.page?.updated_at ? dateFmt.format(new Date(s.page.updated_at)) : "—"}
                        </td>

                        <td className="px-3 py-3">
                          <span className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              disabled={busy}
                              onClick={() =>
                                run(
                                  () => setServiceFeatured(s.page_id, !s.is_featured),
                                  s.is_featured ? "Unfeatured" : "Featured"
                                )
                              }
                            >
                              <Star />
                              {s.is_featured ? "Unfeature" : "Feature"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditing(s)}
                              aria-label={`Edit catalogue details for ${s.page?.title ?? "this service"}`}
                            >
                              <Pencil />
                            </Button>
                            {/* Content is edited in the page builder — the one
                                editor — rather than in a second one here. */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              render={<Link href={`/admin/content/pages/${s.page_id}`} />}
                              aria-label={`Open ${s.page?.title ?? "this service"} in the page builder`}
                            >
                              <Boxes />
                            </Button>
                            {s.page?.status === "published" && s.page.slug && (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                render={<Link href={`/${s.page.slug}`} target="_blank" />}
                                aria-label={`View the published ${s.page.title} page`}
                              >
                                <ExternalLink />
                              </Button>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --------------------------------------------------- catalogue edit -- */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                if (await run(() => updateServiceDetails(editing.page_id, form), "Catalogue saved")) {
                  setEditing(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{editing.page?.title ?? "Service"}</DialogTitle>
                <DialogDescription>
                  Catalogue fields only. The page content, its URL and whether it
                  is published all live in the page builder — there is one
                  editor for those, not two.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sv-category">Category</Label>
                    <Input
                      id="sv-category"
                      name="category"
                      defaultValue={editing.category}
                      list="service-categories"
                      required
                    />
                    <datalist id="service-categories">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sv-order">Display order</Label>
                    <Input
                      id="sv-order"
                      name="displayOrder"
                      type="number"
                      defaultValue={editing.display_order}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sv-price">Starting price</Label>
                    <Input
                      id="sv-price"
                      name="priceFrom"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Not priced yet"
                      defaultValue={editing.price_from ?? ""}
                    />
                    <p className="text-xs text-ink-tertiary">
                      Leave empty rather than entering 0 — an empty price shows
                      a dash, a zero advertises the service as free.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sv-currency">Currency</Label>
                    <Input
                      id="sv-currency"
                      name="currency"
                      maxLength={3}
                      defaultValue={editing.currency}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sv-lead">Lead time (weeks)</Label>
                    <Input
                      id="sv-lead"
                      name="leadTimeWeeks"
                      type="number"
                      min="0"
                      max="260"
                      placeholder="Not estimated"
                      defaultValue={editing.lead_time_weeks ?? ""}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sv-summary">Catalogue summary</Label>
                  <Textarea
                    id="sv-summary"
                    name="summary"
                    rows={2}
                    maxLength={400}
                    defaultValue={editing.summary ?? ""}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    defaultChecked={editing.is_featured}
                    className="size-4 rounded border-line-strong"
                  />
                  Feature this service on the public services page
                </label>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
