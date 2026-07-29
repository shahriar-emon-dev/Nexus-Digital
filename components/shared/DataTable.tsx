"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  id: string;
  header: string;
  /** Cell renderer. Return a node; keep formatting out of the row data. */
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting. Omit to make the column unsortable. */
  sortBy?: (row: T) => string | number;
  /** Right-aligns and applies tabular figures — use for every money/count column. */
  numeric?: boolean;
  width?: string;
  className?: string;
};

type SortState = { id: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  data,
  columns,
  getRowId,
  searchable = true,
  searchPlaceholder = "Search…",
  searchBy,
  selectable = false,
  onSelectionChange,
  pageSize = 10,
  loading = false,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  toolbar,
  className,
}: {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Text pulled from a row for the search filter. Defaults to every cell's text. */
  searchBy?: (row: T) => string;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) => {
      const text = searchBy ? searchBy(row) : JSON.stringify(row);
      return text.toLowerCase().includes(q);
    });
  }, [data, query, searchBy]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortBy) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortBy!(a);
      const bv = col.sortBy!(b);
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const rows = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (id: string) =>
    setSort((s) =>
      s?.id !== id ? { id, dir: "asc" } : s.dir === "asc" ? { id, dir: "desc" } : null
    );

  const commitSelection = (next: Set<string>) => {
    setSelected(next);
    onSelectionChange?.([...next]);
  };

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(getRowId(r)));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-3">
          {searchable && (
            <InputGroup
              className="h-9"
              leading={<Search />}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              aria-label={searchPlaceholder}
            />
          )}
          {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-line bg-brand-subtle px-3 py-2 text-sm text-brand-subtle-fg">
          <span className="font-medium">{selected.size} selected</span>
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            onClick={() => commitSelection(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            compact
            icon={Inbox}
            title={query ? "No matches" : emptyTitle}
            description={
              query ? `Nothing matches “${query}”. Try a different search.` : emptyDescription
            }
            action={query ? undefined : emptyAction}
            className="rounded-none border-0 bg-transparent"
          />
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-sunken/80 backdrop-blur">
              <TableRow className="hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-10 pr-0">
                    <Checkbox
                      checked={allOnPageSelected}
                      aria-label="Select all rows on this page"
                      onCheckedChange={(checked) => {
                        const next = new Set(selected);
                        rows.forEach((r) =>
                          checked ? next.add(getRowId(r)) : next.delete(getRowId(r))
                        );
                        commitSelection(next);
                      }}
                    />
                  </TableHead>
                )}
                {columns.map((col) => {
                  const active = sort?.id === col.id;
                  const SortIcon = !active
                    ? ChevronsUpDown
                    : sort!.dir === "asc"
                      ? ArrowUp
                      : ArrowDown;
                  return (
                    <TableHead
                      key={col.id}
                      numeric={col.numeric}
                      style={col.width ? { width: col.width } : undefined}
                      aria-sort={
                        active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"
                      }
                      className={col.className}
                    >
                      {col.sortBy ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-ink",
                            active && "text-ink",
                            col.numeric && "flex-row-reverse"
                          )}
                        >
                          {col.header}
                          <SortIcon className="size-3" aria-hidden />
                        </button>
                      ) : (
                        col.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                return (
                  <TableRow key={id} data-selected={isSelected ? "" : undefined}>
                    {selectable && (
                      <TableCell className="pr-0">
                        <Checkbox
                          checked={isSelected}
                          aria-label={`Select row ${id}`}
                          onCheckedChange={(checked) => {
                            const next = new Set(selected);
                            if (checked) next.add(id);
                            else next.delete(id);
                            commitSelection(next);
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} numeric={col.numeric} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && sorted.length > pageSize && (
        <div className="flex items-center justify-between gap-3 text-sm text-ink-tertiary">
          <span data-tabular>
            {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
