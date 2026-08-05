"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
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
  createInvoice,
  deleteInvoice,
  deletePayment,
  recordPayment,
  setInvoiceStatus,
  updateInvoice,
  type AdminInvoice,
  type InvoiceDetail,
  type InvoiceStatus,
  type DraftLine,
} from "@/lib/supabase/invoice-actions";
import { cn } from "@/lib/utils";

const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "void"];

const statusTone: Record<InvoiceStatus, "default" | "info" | "success" | "danger" | "outline"> = {
  draft: "default",
  sent: "info",
  paid: "success",
  overdue: "danger",
  void: "outline",
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function InvoicesTable({
  initial,
  organizations,
  detail,
}: {
  initial: AdminInvoice[];
  organizations: { id: string; name: string }[];
  /** Line items and payments, keyed by invoice id — loaded once by the page. */
  detail: Record<string, Pick<InvoiceDetail, "lineItems" | "payments">>;
}) {
  const router = useRouter();
  const toast = useToast();

  const [invoices, setInvoices] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminInvoice | null>(null);
  const [paying, setPaying] = React.useState<AdminInvoice | null>(null);
  const [removing, setRemoving] = React.useState<AdminInvoice | null>(null);

  React.useEffect(() => setInvoices(initial), [initial]);

  // Payments and line items both move the totals, so all three tables matter.
  useRealtime(
    "admin:invoices",
    [{ table: "invoices" }, { table: "invoice_payments" }, { table: "invoice_line_items" }],
    () => router.refresh()
  );

  const summary = React.useMemo(() => {
    const live = invoices.filter((i) => i.status !== "void");
    const late = live.filter((i) => i.isOverdue);
    return {
      billed: live.reduce((n, i) => n + i.totals.total, 0),
      collected: live.reduce((n, i) => n + i.totals.paid, 0),
      outstanding: live.reduce((n, i) => n + i.totals.outstanding, 0),
      overdue: late.reduce((n, i) => n + i.totals.outstanding, 0),
      overdueCount: late.length,
    };
  }, [invoices]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((i) => {
      if (status === "overdue" ? !i.isOverdue : status !== "all" && i.status !== status) return false;
      if (!q) return true;
      return (
        i.number.toLowerCase().includes(q) ||
        (i.organizations?.name ?? "").toLowerCase().includes(q) ||
        (i.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [invoices, query, status]);

  async function run(
    fn: () => Promise<{ ok: true } | { error: string } | { ok: true; data: unknown }>,
    message: string
  ) {
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

      {summary.overdueCount > 0 && (
        <Alert tone="warning">
          <AlertDescription>
            {money.format(summary.overdue)} is overdue across {summary.overdueCount}{" "}
            {summary.overdueCount === 1 ? "invoice" : "invoices"}. Overdue is
            computed from the due date and the outstanding balance, so an
            invoice cannot look current the day after it lapses.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Billed" value={money0.format(summary.billed)} icon={Receipt} />
        <StatCard label="Collected" value={money0.format(summary.collected)} />
        <StatCard
          label="Outstanding"
          value={money0.format(summary.outstanding)}
          caption={summary.overdue > 0 ? `${money0.format(summary.overdue)} overdue` : undefined}
        />
        <StatCard label="Invoices" value={String(invoices.length)} />
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
            placeholder="Search number, client or note…"
            aria-label="Search invoices"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All invoices</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            {STATUSES.filter((s) => s !== "overdue").map((s) => (
              <SelectItem key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setCreating(true)}>
          <Plus />
          New invoice
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} of {invoices.length} invoices.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={invoices.length === 0 ? "No invoices yet" : "No matches"}
          description={
            invoices.length === 0
              ? "Every total is derived from the line items — nothing on an invoice is a figure someone typed into a total field."
              : "No invoice matches that search and filter."
          }
          action={
            invoices.length === 0 ? (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus />
                New invoice
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
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
              <table className="w-full min-w-[60rem] border-collapse text-left">
                <caption className="sr-only">
                  Invoices with their client, totals and outstanding balance.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Number</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Client</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Issued</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Due</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Total</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Outstanding</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((i) => (
                    <tr
                      key={i.id}
                      className={cn(
                        "transition-colors hover:bg-surface-sunken/40",
                        i.status === "void" && "opacity-60"
                      )}
                    >
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <span className="flex items-center gap-2">
                          {i.isOverdue && (
                            <AlertTriangle className="size-3.5 shrink-0 text-danger" aria-label="Overdue" />
                          )}
                          <code className="font-mono text-sm font-semibold text-ink">{i.number}</code>
                        </span>
                      </th>

                      <td className="px-3 py-3 text-sm text-ink-secondary">
                        {i.organizations?.name ?? <span className="text-ink-tertiary">—</span>}
                      </td>

                      <td className="px-3 py-3 text-sm text-ink-secondary">
                        {dateFmt.format(new Date(i.issue_date))}
                      </td>

                      <td className="px-3 py-3 text-sm">
                        {i.due_date ? (
                          <span className={i.isOverdue ? "text-danger" : "text-ink-secondary"}>
                            {dateFmt.format(new Date(i.due_date))}
                          </span>
                        ) : (
                          <span className="text-ink-tertiary">—</span>
                        )}
                      </td>

                      <td data-tabular className="px-3 py-3 text-right text-sm text-ink">
                        {money.format(i.totals.total)}
                      </td>

                      <td
                        data-tabular
                        className={cn(
                          "px-3 py-3 text-right text-sm",
                          i.totals.outstanding > 0 ? "font-semibold text-ink" : "text-ink-tertiary"
                        )}
                      >
                        {money.format(i.totals.outstanding)}
                      </td>

                      <td className="px-3 py-3">
                        <Badge variant={i.isOverdue ? "danger" : statusTone[i.status]} size="sm">
                          {i.isOverdue && i.status !== "overdue" ? "overdue" : i.status}
                        </Badge>
                      </td>

                      <td className="px-3 py-3">
                        <span className="flex justify-end gap-1">
                          {i.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => run(() => setInvoiceStatus(i.id, "sent"), "Marked as sent")}
                            >
                              Send
                            </Button>
                          )}
                          {i.totals.outstanding > 0 && i.status !== "void" && (
                            <Button variant="ghost" size="xs" onClick={() => setPaying(i)}>
                              <CreditCard />
                              Payment
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setEditing(i)}
                            aria-label={`Open ${i.number}`}
                          >
                            <FileText />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-danger"
                            onClick={() => setRemoving(i)}
                            aria-label={`Delete ${i.number}`}
                          >
                            <Trash2 />
                          </Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <InvoiceDialog
        open={creating}
        onOpenChange={setCreating}
        organizations={organizations}
        busy={busy}
        onSubmit={async (form) => {
          if (await run(() => createInvoice(form), "Invoice created")) setCreating(false);
        }}
      />

      {editing && (
        <InvoiceDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          organizations={organizations}
          busy={busy}
          invoice={editing}
          lines={detail[editing.id]?.lineItems ?? []}
          payments={detail[editing.id]?.payments ?? []}
          onDeletePayment={async (id) => {
            await run(() => deletePayment(id), "Payment removed");
          }}
          onSubmit={async (form) => {
            if (await run(() => updateInvoice(editing.id, form), "Invoice saved")) setEditing(null);
          }}
        />
      )}

      {/* -------------------------------------------------- record payment -- */}
      <Dialog open={paying !== null} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent>
          {paying && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                if (await run(() => recordPayment(paying.id, form), "Payment recorded")) {
                  setPaying(null);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Record a payment on {paying.number}</DialogTitle>
                <DialogDescription>
                  {money.format(paying.totals.outstanding)} outstanding of{" "}
                  {money.format(paying.totals.total)}. The invoice is marked
                  paid only when the balance actually reaches zero.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pay-amount">Amount</Label>
                    <Input
                      id="pay-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      defaultValue={paying.totals.outstanding.toFixed(2)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pay-date">Paid on</Label>
                    <Input
                      id="pay-date"
                      name="paidAt"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pay-method">Method</Label>
                    <Input id="pay-method" name="method" placeholder="Bank transfer, Stripe…" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pay-ref">Reference</Label>
                    <Input id="pay-ref" name="reference" placeholder="Transaction id" />
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
                  Record payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------- delete -- */}
      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          {removing && (
            <>
              <DialogHeader>
                <DialogTitle>Delete {removing.number}?</DialogTitle>
                <DialogDescription>
                  Its line items and recorded payments go with it, and the
                  client loses the invoice from their portal. Voiding keeps the
                  record and removes it from every money figure — usually the
                  right choice for something already sent.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="justify-between">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => setInvoiceStatus(removing.id, "void"), "Invoice voided")) {
                      setRemoving(null);
                    }
                  }}
                >
                  <X />
                  Void instead
                </Button>
                <div className="flex gap-2">
                  <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={async () => {
                      if (await run(() => deleteInvoice(removing.id), "Invoice deleted")) {
                        setRemoving(null);
                      }
                    }}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --------------------------------------------------------------- editor -- */

type EditableLine = DraftLine & { key: string };

const blankLine = (): EditableLine => ({
  key: Math.random().toString(36).slice(2),
  description: "",
  quantity: 1,
  unitPrice: 0,
});

/**
 * One editor for creating and editing.
 *
 * The totals shown while typing use the same arithmetic as the database view —
 * tax on the discounted subtotal, not the gross. Getting that wrong in the UI
 * would show a figure the invoice then contradicts the moment it is saved.
 */
function InvoiceDialog({
  open,
  onOpenChange,
  organizations,
  invoice,
  lines: initialLines,
  payments,
  busy,
  onSubmit,
  onDeletePayment,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizations: { id: string; name: string }[];
  invoice?: AdminInvoice;
  lines?: { description: string; quantity: number; unit_price: number }[];
  payments?: { id: string; amount: number; paid_at: string; method: string | null; reference: string | null }[];
  busy: boolean;
  onSubmit: (form: FormData) => Promise<void>;
  onDeletePayment?: (id: string) => Promise<void>;
}) {
  const [lines, setLines] = React.useState<EditableLine[]>(() =>
    initialLines?.length
      ? initialLines.map((l) => ({
          key: Math.random().toString(36).slice(2),
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unit_price),
        }))
      : [blankLine()]
  );
  const [discountPct, setDiscountPct] = React.useState(Number(invoice?.discount_pct ?? 0));
  const [taxPct, setTaxPct] = React.useState(Number(invoice?.tax_pct ?? 0));

  const subtotal = lines.reduce((n, l) => n + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const discount = subtotal * (discountPct / 100);
  const tax = (subtotal - discount) * (taxPct / 100);
  const total = subtotal - discount + tax;
  const paid = (payments ?? []).reduce((n, p) => n + Number(p.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            form.set(
              "lines",
              JSON.stringify(
                lines
                  .filter((l) => l.description.trim())
                  .map((l) => ({
                    description: l.description,
                    quantity: Number(l.quantity),
                    unitPrice: Number(l.unitPrice),
                  }))
              )
            );
            await onSubmit(form);
          }}
        >
          <DialogHeader>
            <DialogTitle>{invoice ? invoice.number : "New invoice"}</DialogTitle>
            <DialogDescription>
              Totals are computed from the lines below and recomputed by the
              database on save — there is no total field to disagree with them.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="inv-org">Client</Label>
                {invoice ? (
                  // Moving an invoice between clients would rewrite whose
                  // ledger it belongs to, so it is fixed once issued.
                  <Input value={invoice.organizations?.name ?? "—"} readOnly disabled />
                ) : (
                  <select
                    id="inv-org"
                    name="organizationId"
                    required
                    className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                  >
                    <option value="">Choose a client…</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-status">Status</Label>
                <select
                  id="inv-status"
                  name="status"
                  defaultValue={invoice?.status ?? "draft"}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-issue">Issue date</Label>
                <Input
                  id="inv-issue"
                  name="issueDate"
                  type="date"
                  defaultValue={invoice?.issue_date ?? new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-due">Due date</Label>
                <Input id="inv-due" name="dueDate" type="date" defaultValue={invoice?.due_date ?? ""} />
              </div>

              {!invoice && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="inv-number">Number</Label>
                  <Input id="inv-number" name="number" placeholder="Generated if left empty" />
                </div>
              )}
            </div>

            {/* ------------------------------------------------------ lines -- */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Line items</span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setLines((ls) => [...ls, blankLine()])}
                >
                  <Plus />
                  Add line
                </Button>
              </div>

              <ul className="flex flex-col gap-2">
                {lines.map((l, index) => (
                  <li key={l.key} className="flex flex-wrap items-end gap-2">
                    <div className="min-w-40 flex-1">
                      <Label htmlFor={`line-desc-${l.key}`} className="sr-only">
                        Description for line {index + 1}
                      </Label>
                      <Input
                        id={`line-desc-${l.key}`}
                        value={l.description}
                        placeholder="What is being billed"
                        onChange={(e) =>
                          setLines((ls) =>
                            ls.map((x) => (x.key === l.key ? { ...x, description: e.target.value } : x))
                          )
                        }
                      />
                    </div>
                    <div className="w-20">
                      <Label htmlFor={`line-qty-${l.key}`} className="sr-only">
                        Quantity for line {index + 1}
                      </Label>
                      <Input
                        id={`line-qty-${l.key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.quantity}
                        onChange={(e) =>
                          setLines((ls) =>
                            ls.map((x) =>
                              x.key === l.key ? { ...x, quantity: Number(e.target.value) } : x
                            )
                          )
                        }
                      />
                    </div>
                    <div className="w-28">
                      <Label htmlFor={`line-price-${l.key}`} className="sr-only">
                        Unit price for line {index + 1}
                      </Label>
                      <Input
                        id={`line-price-${l.key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.unitPrice}
                        onChange={(e) =>
                          setLines((ls) =>
                            ls.map((x) =>
                              x.key === l.key ? { ...x, unitPrice: Number(e.target.value) } : x
                            )
                          )
                        }
                      />
                    </div>
                    <span
                      data-tabular
                      className="w-24 pb-2 text-right text-sm text-ink-secondary"
                    >
                      {money.format((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-danger"
                      disabled={lines.length === 1}
                      onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                      aria-label={`Remove line ${index + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ----------------------------------------------------- totals -- */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Label htmlFor="inv-discount" className="w-24">Discount %</Label>
                  <Input
                    id="inv-discount"
                    name="discountPct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="inv-tax" className="w-24">Tax %</Label>
                  <Input
                    id="inv-tax"
                    name="taxPct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxPct}
                    onChange={(e) => setTaxPct(Number(e.target.value))}
                  />
                </div>
              </div>

              <dl className="flex flex-col gap-1.5 rounded-lg border border-line-subtle bg-surface-sunken p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-tertiary">Subtotal</dt>
                  <dd data-tabular className="text-ink">{money.format(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-tertiary">Discount</dt>
                  <dd data-tabular className="text-ink">−{money.format(discount)}</dd>
                </div>
                <div className="flex justify-between">
                  {/* Charged on the discounted subtotal, matching the view. */}
                  <dt className="text-ink-tertiary">Tax</dt>
                  <dd data-tabular className="text-ink">{money.format(tax)}</dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-line-subtle pt-2 font-semibold">
                  <dt className="text-ink">Total</dt>
                  <dd data-tabular className="text-ink">{money.format(total)}</dd>
                </div>
                {payments && payments.length > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Paid</dt>
                    <dd data-tabular>{money.format(paid)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea id="inv-notes" name="notes" rows={2} defaultValue={invoice?.notes ?? ""} />
            </div>

            {payments && payments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-ink-tertiary uppercase">
                  Payments
                </p>
                <ul className="divide-y divide-line-subtle rounded-lg border border-line-subtle">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span data-tabular className="font-medium text-ink">
                        {money.format(Number(p.amount))}
                      </span>
                      <span className="text-ink-tertiary">
                        {dateFmt.format(new Date(p.paid_at))}
                        {p.method ? ` · ${p.method}` : ""}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </span>
                      {onDeletePayment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="ml-auto text-danger"
                          onClick={() => onDeletePayment(p.id)}
                          aria-label={`Remove the ${money.format(Number(p.amount))} payment`}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
              {invoice ? "Save invoice" : "Create invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
