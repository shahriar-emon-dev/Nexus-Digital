import * as React from "react";

import { cn } from "@/lib/utils";

/** Wide tables scroll inside their own container — the page never scrolls sideways. */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-line", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t border-line bg-surface-sunken font-medium", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-line-subtle transition-colors duration-(--duration-instant)",
        "hover:bg-surface-sunken/60 data-selected:bg-brand-subtle",
        className
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  numeric,
  ...props
}: React.ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 text-left align-middle",
        "text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase",
        "whitespace-nowrap",
        numeric && "text-right",
        className
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  numeric,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      data-tabular={numeric ? "" : undefined}
      className={cn(
        "px-4 py-3 align-middle text-ink-secondary",
        numeric && "text-right text-ink",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-xs text-ink-tertiary", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
