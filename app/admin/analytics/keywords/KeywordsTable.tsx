"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
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
  createKeyword,
  deleteKeyword,
  recordPosition,
  updateKeyword,
  type KeywordIntent,
  type TrackedKeyword,
} from "@/lib/supabase/seo-actions";
import { cn } from "@/lib/utils";

const INTENTS: KeywordIntent[] = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
];

const intentTone: Record<KeywordIntent, "brand" | "ion" | "default" | "info"> = {
  informational: "default",
  commercial: "ion",
  transactional: "brand",
  navigational: "info",
};

const num = new Intl.NumberFormat("en-US", { notation: "compact" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });

type SortKey = "term" | "position" | "volume" | "difficulty";

export function KeywordsTable({
  initial,
  pages,
}: {
  initial: TrackedKeyword[];
  pages: { id: string; title: string; slug: string }[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [keywords, setKeywords] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [intent, setIntent] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("position");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<TrackedKeyword | null>(null);
  const [ranking, setRanking] = React.useState<TrackedKeyword | null>(null);
  const [removing, setRemoving] = React.useState<TrackedKeyword | null>(null);

  React.useEffect(() => setKeywords(initial), [initial]);

  useRealtime(
    "admin:keywords",
    [{ table: "seo_keywords" }, { table: "keyword_rankings" }],
    () => router.refresh()
  );

  const summary = React.useMemo(() => {
    const measured = keywords.filter((k) => k.position !== null);
    return {
      tracked: keywords.length,
      measured: measured.length,
      topTen: measured.filter((k) => (k.position ?? 999) <= 10).length,
      // Null rather than 0 when nothing is measured: an average of no ranks is
      // not "position zero", it is no answer.
      average: measured.length
        ? (measured.reduce((n, k) => n + (k.position ?? 0), 0) / measured.length).toFixed(1)
        : null,
    };
  }, [keywords]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = keywords.filter((k) => {
      if (intent !== "all" && k.intent !== intent) return false;
      if (!q) return true;
      return (
        k.term.toLowerCase().includes(q) ||
        (k.target_url ?? "").toLowerCase().includes(q) ||
        (k.pages?.title ?? "").toLowerCase().includes(q)
      );
    });

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "position":
          // Unmeasured terms sort last: they are not "ranking worst", they are
          // simply not measured, and burying them keeps the list readable.
          return (a.position ?? 999) - (b.position ?? 999);
        case "volume":
          return (b.search_volume ?? -1) - (a.search_volume ?? -1);
        case "difficulty":
          return (a.difficulty ?? 999) - (b.difficulty ?? 999);
        default:
          return a.term.localeCompare(b.term);
      }
    });
  }, [keywords, query, intent, sort]);

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
        <StatCard label="Tracked" value={String(summary.tracked)} icon={Target} />
        <StatCard
          label="Measured"
          value={String(summary.measured)}
          caption={
            summary.tracked - summary.measured > 0
              ? `${summary.tracked - summary.measured} never checked`
              : "All have a position"
          }
        />
        <StatCard label="In the top ten" value={String(summary.topTen)} />
        <StatCard
          label="Average position"
          value={summary.average ?? "—"}
          caption={summary.average ? "Across measured terms" : "Nothing measured yet"}
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
            placeholder="Search keyword or target page…"
            aria-label="Search keywords"
            className="pl-9"
          />
        </div>

        <Select value={intent} onValueChange={(v) => setIntent(v as string)}>
          <SelectTrigger className="w-44" aria-label="Filter by intent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All intents</SelectItem>
            {INTENTS.map((i) => (
              <SelectItem key={i} value={i}>
                {i[0].toUpperCase() + i.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-40" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="position">Position</SelectItem>
            <SelectItem value="term">Keyword</SelectItem>
            <SelectItem value="volume">Search volume</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setCreating(true)}>
          <Plus />
          New keyword
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Target}
          title={keywords.length === 0 ? "No keywords tracked" : "No matches"}
          description={
            keywords.length === 0
              ? "Add the terms you want to rank for. Positions are recorded manually or imported, and movement is computed from consecutive snapshots rather than stored."
              : "No keyword matches that search and filter."
          }
          action={
            keywords.length === 0 ? (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus />
                New keyword
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setIntent("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[58rem] border-collapse text-left">
                <caption className="sr-only">
                  Tracked keywords with intent, volume, difficulty and latest position.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Keyword</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Intent</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Volume</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Difficulty</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Position</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Change</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((k) => {
                    const target = k.pages ? `/${k.pages.slug}` : k.target_url;
                    return (
                      <tr key={k.id} className="transition-colors hover:bg-surface-sunken/40">
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="block text-sm font-semibold text-ink">{k.term}</span>
                          <span className="block truncate text-xs text-ink-tertiary">
                            {target ?? "No target page set"}
                          </span>
                        </th>

                        <td className="px-3 py-3">
                          <Badge variant={intentTone[k.intent]} size="sm">
                            {k.intent}
                          </Badge>
                        </td>

                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {k.search_volume === null ? (
                            <span className="text-ink-tertiary">—</span>
                          ) : (
                            num.format(k.search_volume)
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {k.difficulty === null ? (
                            <span className="text-sm text-ink-tertiary">—</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
                                <span
                                  className={cn(
                                    "block h-full rounded-full",
                                    k.difficulty >= 70
                                      ? "bg-danger"
                                      : k.difficulty >= 40
                                        ? "bg-warning"
                                        : "bg-success"
                                  )}
                                  style={{ width: `${k.difficulty}%` }}
                                />
                              </span>
                              <span data-tabular className="text-xs text-ink-secondary">
                                {k.difficulty}%
                              </span>
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {k.position === null ? (
                            <Button variant="ghost" size="xs" onClick={() => setRanking(k)}>
                              Record
                            </Button>
                          ) : (
                            <span>
                              <span
                                data-tabular
                                className={cn(
                                  "block text-sm font-semibold",
                                  k.position <= 3
                                    ? "text-success"
                                    : k.position <= 10
                                      ? "text-ink"
                                      : "text-ink-secondary"
                                )}
                              >
                                #{k.position}
                              </span>
                              {k.measuredOn && (
                                <span className="block text-xs text-ink-tertiary">
                                  {dateFmt.format(new Date(k.measuredOn))}
                                </span>
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {k.movement === null ? (
                            <span className="text-sm text-ink-tertiary">—</span>
                          ) : (
                            // Direction is stated by an arrow and a sign as
                            // well as colour, so it survives greyscale.
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-sm",
                                k.movement > 0
                                  ? "text-success"
                                  : k.movement < 0
                                    ? "text-danger"
                                    : "text-ink-tertiary"
                              )}
                            >
                              {k.movement > 0 ? (
                                <ArrowUpRight className="size-3.5" aria-hidden />
                              ) : k.movement < 0 ? (
                                <ArrowDownRight className="size-3.5" aria-hidden />
                              ) : (
                                <Minus className="size-3.5" aria-hidden />
                              )}
                              <span data-tabular>{Math.abs(k.movement)}</span>
                              <span className="sr-only">
                                {k.movement > 0
                                  ? "places improved"
                                  : k.movement < 0
                                    ? "places lost"
                                    : "unchanged"}
                              </span>
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span className="flex justify-end gap-1">
                            <Button variant="ghost" size="xs" onClick={() => setRanking(k)}>
                              Rank
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditing(k)}
                              aria-label={`Edit ${k.term}`}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-danger"
                              onClick={() => setRemoving(k)}
                              aria-label={`Delete ${k.term}`}
                            >
                              <Trash2 />
                            </Button>
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

      <KeywordDialog
        open={creating}
        onOpenChange={setCreating}
        pages={pages}
        busy={busy}
        title="Track a keyword"
        submitLabel="Add keyword"
        onSubmit={async (form) => {
          if (await run(() => createKeyword(form), "Keyword added")) setCreating(false);
        }}
      />

      {editing && (
        <KeywordDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          pages={pages}
          busy={busy}
          keyword={editing}
          title={`Edit ${editing.term}`}
          submitLabel="Save changes"
          onSubmit={async (form) => {
            if (await run(() => updateKeyword(editing.id, form), "Keyword saved")) setEditing(null);
          }}
        />
      )}

      {/* ---------------------------------------------------- record rank -- */}
      <Dialog open={ranking !== null} onOpenChange={(o) => !o && setRanking(null)}>
        <DialogContent>
          {ranking && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                if (await run(() => recordPosition(ranking.id, form), "Position recorded")) {
                  setRanking(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Record a position for “{ranking.term}”</DialogTitle>
                <DialogDescription>
                  {ranking.position === null
                    ? "No position has been recorded yet, so there is nothing to compare against until a second reading."
                    : `Currently #${ranking.position}. Movement is computed from this reading and the previous one.`}
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="k-position">Position</Label>
                    <Input
                      id="k-position"
                      name="position"
                      type="number"
                      min="1"
                      max="200"
                      required
                      defaultValue={ranking.position ?? ""}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="k-date">Measured on</Label>
                    <Input
                      id="k-date"
                      name="recordedOn"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="k-source">Source</Label>
                  <Input id="k-source" name="source" defaultValue="manual" />
                  <p className="text-xs text-ink-tertiary">
                    Where the reading came from — a rank tracker, Search Console
                    or a manual check. Recording twice on one date corrects that
                    day rather than adding a second snapshot.
                  </p>
                </div>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
                  Record
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          {removing && (
            <>
              <DialogHeader>
                <DialogTitle>Stop tracking “{removing.term}”?</DialogTitle>
                <DialogDescription>
                  Its position history goes with it, so the movement record for
                  this term cannot be recovered.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => deleteKeyword(removing.id), "Keyword removed")) {
                      setRemoving(null);
                    }
                  }}
                >
                  <Trash2 />
                  Stop tracking
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KeywordDialog({
  open,
  onOpenChange,
  pages,
  keyword,
  title,
  submitLabel,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pages: { id: string; title: string; slug: string }[];
  keyword?: TrackedKeyword;
  title: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit(new FormData(e.currentTarget));
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Volume and difficulty come from a research tool. Leave them empty
              until you have looked them up — an empty field reads as
              &ldquo;not researched&rdquo;, where a zero would claim the term has
              no search volume.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="k-term">Keyword</Label>
              <Input id="k-term" name="term" required defaultValue={keyword?.term} maxLength={200} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="k-intent">Intent</Label>
                <select
                  id="k-intent"
                  name="intent"
                  defaultValue={keyword?.intent ?? "informational"}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  {INTENTS.map((i) => (
                    <option key={i} value={i}>
                      {i[0].toUpperCase() + i.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="k-page">Target page</Label>
                <select
                  id="k-page"
                  name="pageId"
                  defaultValue={keyword?.page_id ?? ""}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  <option value="">None</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (/{p.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="k-volume">Search volume</Label>
                <Input
                  id="k-volume"
                  name="searchVolume"
                  type="number"
                  min="0"
                  placeholder="Not researched"
                  defaultValue={keyword?.search_volume ?? ""}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="k-difficulty">Difficulty (0–100)</Label>
                <Input
                  id="k-difficulty"
                  name="difficulty"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Not researched"
                  defaultValue={keyword?.difficulty ?? ""}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="k-url">External target URL</Label>
              <Input
                id="k-url"
                name="targetUrl"
                placeholder="Only if the target is not a CMS page"
                defaultValue={keyword?.target_url ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="k-notes">Notes</Label>
              <Textarea id="k-notes" name="notes" rows={2} defaultValue={keyword?.notes ?? ""} />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
