"use client";

import * as React from "react";
import { Wrench } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  HIGH_IMPACT_MS,
  queriesByLoad,
  queryLoadPerMin,
  type SlowQuery,
} from "@/lib/infrastructure";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const full = new Intl.NumberFormat("en-US");

/**
 * The slow-query table.
 *
 * Ordered by total time burned per minute rather than by single execution time.
 * The slowest statement is not necessarily the most expensive one: a 410ms
 * query called 1,240 times a minute costs far more than a 1,420ms query called
 * 42 times, and ranking by `execMs` alone hides that.
 */
export function QueryInspector() {
  const [inspecting, setInspecting] = React.useState<SlowQuery | null>(null);
  const [open, setOpen] = React.useState(false);

  return (
    <Card variant="glass" className="min-w-0 gap-0 overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
        <div>
          <h2 className="font-heading text-xl font-semibold text-ink">
            Heavy query inspector
          </h2>
          <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
            Ranked by time burned per minute, not by single execution.
          </p>
        </div>
        {/* Derived from the threshold, not a typed-in count. */}
        <Badge variant="danger" className="whitespace-nowrap">
          <span data-tabular>
            {queriesByLoad.filter((q) => q.execMs >= HIGH_IMPACT_MS).length}
          </span>
          {" "}high impact
        </Badge>
      </div>

      <div className="scrollbar-none min-w-0 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <caption className="sr-only">
            Slowest database queries in the current window
          </caption>
          <thead>
            <tr className="border-b border-line bg-surface-sunken/40">
              {[
                "Query",
                "Exec time",
                "Rows scanned",
                "Calls / min",
                "Load / min",
                "Action",
              ].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={cn(
                    "px-6 py-4 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase",
                    i === 5 && "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line-subtle">
            {queriesByLoad.map((query) => {
              const heavy = query.execMs >= HIGH_IMPACT_MS;
              return (
                <tr
                  key={query.id}
                  className="transition-colors duration-(--duration-fast) hover:bg-surface-sunken/60"
                >
                  <th scope="row" className="px-6 py-4 text-left font-normal">
                    <span className="block font-mono text-[0.8125rem] font-semibold text-brand">
                      {query.hash}
                    </span>
                    <span className="block truncate text-[0.75rem] text-ink-tertiary">
                      {query.table}
                    </span>
                  </th>

                  <td
                    data-tabular
                    className={cn(
                      "px-6 py-4 font-semibold whitespace-nowrap",
                      heavy ? "text-danger" : "text-ink"
                    )}
                  >
                    {full.format(query.execMs)} ms
                  </td>

                  <td
                    data-tabular
                    className="px-6 py-4 whitespace-nowrap text-ink-secondary"
                  >
                    {compact.format(query.rowsScanned)}
                  </td>

                  <td
                    data-tabular
                    className="px-6 py-4 whitespace-nowrap text-ink-secondary"
                  >
                    {full.format(query.callsPerMin)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-line"
                        role="progressbar"
                        aria-label={`Relative load for ${query.hash}`}
                        aria-valuenow={Math.round(queryLoadPerMin(query))}
                        aria-valuemin={0}
                        aria-valuemax={Math.round(queryLoadPerMin(queriesByLoad[0]))}
                      >
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            heavy ? "bg-danger" : "bg-brand"
                          )}
                          style={{
                            width: `${
                              (queryLoadPerMin(query) / queryLoadPerMin(queriesByLoad[0])) * 100
                            }%`,
                          }}
                        />
                      </span>
                      <span data-tabular className="text-[0.75rem] font-medium text-ink">
                        {queryLoadPerMin(query).toFixed(1)}s
                      </span>
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInspecting(query);
                        setOpen(true);
                      }}
                    >
                      <Wrench />
                      Optimise
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <OptimiseDialog query={inspecting} open={open} onOpenChange={setOpen} />
    </Card>
  );
}

/**
 * Shows the statement and the suggested index. Applying it is a migration, so
 * the dialog stops at showing the SQL rather than pretending to run DDL against
 * a production database from a dashboard button.
 */
function OptimiseDialog({
  query,
  open,
  onOpenChange,
}: {
  query: SlowQuery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {query && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono">{query.hash}</DialogTitle>
              <DialogDescription>
                {full.format(query.execMs)} ms per call, {full.format(query.callsPerMin)}{" "}
                calls per minute on <code>{query.table}</code>.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                  Statement
                </p>
                <pre className="scrollbar-none overflow-x-auto rounded-xl border border-line bg-canvas p-4 font-mono text-[0.75rem] leading-relaxed text-ink">
                  <code>{query.statement}</code>
                </pre>
              </div>

              <div>
                <p className="mb-2 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                  Suggested change
                </p>
                <p className="text-ink-secondary">{query.suggestion}</p>
              </div>

              <Alert tone="warning">
                <AlertTitle>Applied by migration, not from here</AlertTitle>
                <AlertDescription>
                  {/* TODO: link to the migration generator once it exists. */}
                  Index changes are schema changes. Raise them through a reviewed
                  migration rather than executing DDL from a dashboard.
                </AlertDescription>
              </Alert>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" render={<DialogClose />}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
