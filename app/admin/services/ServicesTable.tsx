"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  serviceCategories,
  serviceStatuses,
  serviceStatusTone,
  services,
  type ServiceCategory,
  type ServiceStatus,
} from "@/lib/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputGroup } from "@/components/ui/input";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
});
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

type SortKey = "name" | "fromPrice" | "leadTimeWeeks" | "activeProjects" | "updatedAt";

export function ServicesTable() {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<ServiceStatus | "all">("all");
  const [category, setCategory] = React.useState<ServiceCategory | "all">("all");
  const [sort, setSort] = React.useState<SortKey>("updatedAt");
  const [descending, setDescending] = React.useState(true);

  const filtersActive = query.trim() !== "" || status !== "all" || category !== "all";

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = services.filter((service) => {
      if (status !== "all" && service.status !== status) return false;
      if (category !== "all" && service.category !== category) return false;
      if (!q) return true;
      return (
        service.name.toLowerCase().includes(q) ||
        service.slug.includes(q) ||
        service.summary.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const delta =
        sort === "name" || sort === "updatedAt"
          ? String(a[sort]).localeCompare(String(b[sort]))
          : Number(a[sort]) - Number(b[sort]);
      return descending ? -delta : delta;
    });
  }, [query, status, category, sort, descending]);

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDescending((d) => !d);
    } else {
      setSort(key);
      setDescending(key !== "name");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <InputGroup
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, slug or summary"
              aria-label="Search services"
              leading={<Search />}
            />
          </div>

          <Field label="Status">
            <Select
              value={status}
              onChange={(v) => setStatus(v as ServiceStatus | "all")}
              ariaLabel="Status"
            >
              <option value="all">All statuses</option>
              {serviceStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Category">
            <Select
              value={category}
              onChange={(v) => setCategory(v as ServiceCategory | "all")}
              ariaLabel="Category"
            >
              <option value="all">All categories</option>
              {serviceCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setCategory("all");
              }}
            >
              <SlidersHorizontal />
              Clear
            </Button>
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {rows.length} of {services.length} services.
      </p>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card variant="glass" className="min-w-0 gap-0 overflow-hidden rounded-2xl">
        <div className="scrollbar-none min-w-0 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <caption className="sr-only">
              Every service in the catalogue, with its status and delivery terms.
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunken/60">
                <SortableHeader
                  label="Service"
                  active={sort === "name"}
                  descending={descending}
                  onClick={() => toggleSort("name")}
                />
                <th
                  scope="col"
                  className="px-5 py-4 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-5 py-4 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
                >
                  Status
                </th>
                <SortableHeader
                  label="From"
                  active={sort === "fromPrice"}
                  descending={descending}
                  onClick={() => toggleSort("fromPrice")}
                />
                <SortableHeader
                  label="Lead time"
                  active={sort === "leadTimeWeeks"}
                  descending={descending}
                  onClick={() => toggleSort("leadTimeWeeks")}
                />
                <SortableHeader
                  label="Active"
                  active={sort === "activeProjects"}
                  descending={descending}
                  onClick={() => toggleSort("activeProjects")}
                />
                <SortableHeader
                  label="Updated"
                  active={sort === "updatedAt"}
                  descending={descending}
                  onClick={() => toggleSort("updatedAt")}
                />
                <th
                  scope="col"
                  className="px-5 py-4 text-right text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line-subtle">
              {rows.map((service) => (
                <tr
                  key={service.id}
                  className="group transition-colors duration-(--duration-fast) hover:bg-surface-sunken/60"
                >
                  <th scope="row" className="px-5 py-4 text-left font-normal">
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="rounded-sm focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    >
                      <span className="block font-semibold text-ink transition-colors group-hover:text-brand">
                        {service.name}
                      </span>
                      <span className="block font-mono text-[0.6875rem] text-ink-tertiary">
                        /services/{service.slug}
                      </span>
                    </Link>
                  </th>

                  <td className="px-5 py-4">
                    <Badge variant="outline" size="sm">
                      {service.category}
                    </Badge>
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant={serviceStatusTone[service.status]} size="sm">
                      {service.status}
                    </Badge>
                  </td>

                  <td data-tabular className="px-5 py-4 font-medium whitespace-nowrap text-ink">
                    {money.format(service.fromPrice)}
                  </td>

                  <td
                    data-tabular
                    className="px-5 py-4 whitespace-nowrap text-ink-secondary"
                  >
                    {service.leadTimeWeeks} wks
                  </td>

                  <td className="px-5 py-4">
                    {service.activeProjects > 0 ? (
                      <Badge variant="brand" size="sm" data-tabular>
                        {service.activeProjects}
                      </Badge>
                    ) : (
                      <span className="text-[0.8125rem] text-ink-tertiary">—</span>
                    )}
                  </td>

                  <td
                    data-tabular
                    className="px-5 py-4 text-[0.8125rem] whitespace-nowrap text-ink-tertiary"
                  >
                    <time dateTime={service.updatedAt}>
                      {shortDate.format(new Date(service.updatedAt))}
                    </time>
                  </td>

                  <td className="px-5 py-4">
                    <span className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${service.name}`}
                        render={<Link href={`/admin/services/${service.id}`} />}
                      >
                        <Pencil />
                      </Button>
                      {/* Only published services have a live page to open. */}
                      {service.status === "Published" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`View ${service.name} on the site`}
                          render={<Link href={`/services/${service.slug}`} />}
                        >
                          <ExternalLink />
                        </Button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-6 py-16 text-center text-ink-tertiary">
            No services match those filters.
          </p>
        )}

        <div className="border-t border-line bg-surface-sunken/60 px-5 py-4 text-[0.8125rem] text-ink-tertiary">
          Showing{" "}
          <span data-tabular className="font-semibold text-ink">
            {rows.length}
          </span>{" "}
          of{" "}
          <span data-tabular className="font-semibold text-ink">
            {services.length}
          </span>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="ml-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9.5 min-w-40 cursor-pointer rounded-lg border border-line bg-surface-sunken px-3",
        "text-[0.8125rem] font-medium text-ink transition-colors hover:border-line-strong",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
      )}
    >
      {children}
    </select>
  );
}

function SortableHeader({
  label,
  active,
  descending,
  onClick,
}: {
  label: string;
  active: boolean;
  descending: boolean;
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (descending ? "descending" : "ascending") : "none"}
      className="px-5 py-4"
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-1 rounded text-[0.6875rem] font-semibold tracking-widest uppercase",
          "transition-colors duration-(--duration-fast)",
          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
          active ? "text-brand" : "text-ink-tertiary hover:text-ink"
        )}
      >
        {label}
        <span aria-hidden className={cn("text-[0.625rem]", !active && "opacity-0")}>
          {descending ? "▼" : "▲"}
        </span>
      </button>
    </th>
  );
}
