/**
 * Billing behind the client portal.
 *
 * Shaped for the eventual `Invoice` / `InvoiceLine` tables. Every total is
 * derived from the line items rather than stored alongside them, so a figure in
 * the table can never disagree with the document it links to — the source
 * design listed a $12,450 outstanding balance above rows summing to $16,250.
 *
 * Must not import `lib/client-portal.ts`; that module reads this one.
 */

export type InvoiceStatus = "Paid" | "Unpaid" | "Overdue";

/** Badge variant per status. Plain strings so `lib/` imports no components. */
export const invoiceStatusTone: Record<InvoiceStatus, "success" | "warning" | "danger"> = {
  Paid: "success",
  Unpaid: "warning",
  Overdue: "danger",
};

export type InvoiceLine = {
  id: string;
  description: string;
  detail: string;
  unitPrice: number;
  quantity: number;
};

export type Invoice = {
  id: string;
  /** `PortalProject["id"]`. Loose to avoid a circular import. */
  projectId?: string;
  reference: string;
  icon: "web" | "ai" | "cloud" | "retainer";
  issuedOn: string;
  dueOn: string;
  status: InvoiceStatus;
  /** Fraction, e.g. 0.1 for 10%. */
  discountRate: number;
  taxRate: number;
  billingPeriod: string;
  currency: "USD";
  recurring?: boolean;
  lines: InvoiceLine[];
  notes: string;
};

export const billingParties = {
  from: {
    name: "Nexus Digital Agency",
    taxId: "US-774-8821-00",
    lines: ["122 Silicon Valley Blvd, Ste 400", "Palo Alto, CA 94301"],
    email: "billing@nexus.agency",
  },
  to: {
    name: "Northwind Retail",
    attn: "Attn: Procurement Division",
    lines: ["788 Innovation Way, Floor 12", "Austin, TX 78701"],
    email: "accounts@northwindretail.com",
  },
};

export const invoices: Invoice[] = [
  {
    id: "INV-2026-0042",
    projectId: "site-rebuild",
    reference: "Storefront Rebuild — Sprint 2",
    icon: "web",
    issuedOn: "2026-05-12",
    dueOn: "2026-05-26",
    status: "Paid",
    discountRate: 0,
    taxRate: 0.05,
    billingPeriod: "Sprint milestone",
    currency: "USD",
    lines: [
      {
        id: "l1",
        description: "Full-stack engineering",
        detail: "Catalogue pipeline and server-rendered product pages",
        unitPrice: 185,
        quantity: 32,
      },
      {
        id: "l2",
        description: "UX/UI design",
        detail: "Checkout flow and responsive behaviour",
        unitPrice: 150,
        quantity: 16,
      },
    ],
    notes:
      "Please include the invoice ID in all correspondence. Standard 30-day payment terms apply.",
  },
  {
    id: "INV-2026-0043",
    projectId: "site-rebuild",
    reference: "AI Integration Phase II",
    icon: "ai",
    issuedOn: "2026-06-12",
    dueOn: "2026-07-12",
    status: "Overdue",
    discountRate: 0.1,
    taxRate: 0.05,
    billingPeriod: "Monthly retainer",
    currency: "USD",
    recurring: true,
    lines: [
      {
        id: "l1",
        description: "Full-stack engineering",
        detail: "Dedicated development for Core v3 update",
        unitPrice: 185,
        quantity: 15,
      },
      {
        id: "l2",
        description: "Cloud infrastructure management",
        detail: "Kubernetes scaling and cost optimisation",
        unitPrice: 250,
        quantity: 4,
      },
      {
        id: "l3",
        description: "UX/UI design consultation",
        detail: "Review of design tokens and accessibility audit",
        unitPrice: 150,
        quantity: 5,
      },
    ],
    notes:
      "Interest of 2% may be charged on overdue payments. Contact billing to arrange terms.",
  },
  {
    id: "INV-2026-0044",
    projectId: "brand-refresh",
    reference: "Cloud Infrastructure Migration",
    icon: "cloud",
    issuedOn: "2026-07-20",
    dueOn: "2026-08-03",
    status: "Unpaid",
    discountRate: 0,
    taxRate: 0.05,
    billingPeriod: "Project phase",
    currency: "USD",
    lines: [
      {
        id: "l1",
        description: "Cloud infrastructure management",
        detail: "Warehouse migration and identity resolution",
        unitPrice: 250,
        quantity: 18,
      },
      {
        id: "l2",
        description: "Full-stack engineering",
        detail: "Ingestion pipeline and reporting endpoints",
        unitPrice: 185,
        quantity: 6,
      },
    ],
    notes: "Standard 30-day payment terms apply.",
  },
  {
    id: "INV-2026-RET-01",
    reference: "Monthly Maintenance Retainer",
    icon: "retainer",
    issuedOn: "2026-07-01",
    dueOn: "2026-08-15",
    status: "Unpaid",
    discountRate: 0,
    taxRate: 0.05,
    billingPeriod: "Monthly retainer",
    currency: "USD",
    recurring: true,
    lines: [
      {
        id: "l1",
        description: "Maintenance retainer",
        detail: "Monitoring, patching and priority support",
        unitPrice: 2381,
        quantity: 1,
      },
    ],
    notes: "Renews automatically on the first of each month.",
  },
  {
    id: "INV-2026-RET-00",
    reference: "Monthly Maintenance Retainer",
    icon: "retainer",
    issuedOn: "2026-06-01",
    dueOn: "2026-06-15",
    status: "Paid",
    discountRate: 0,
    taxRate: 0.05,
    billingPeriod: "Monthly retainer",
    currency: "USD",
    recurring: true,
    lines: [
      {
        id: "l1",
        description: "Maintenance retainer",
        detail: "Monitoring, patching and priority support",
        unitPrice: 2381,
        quantity: 1,
      },
    ],
    notes: "Renews automatically on the first of each month.",
  },
  {
    id: "INV-2026-0041",
    projectId: "analytics-rebuild",
    reference: "Analytics Rebuild — Handover",
    icon: "cloud",
    issuedOn: "2026-02-14",
    dueOn: "2026-02-28",
    status: "Paid",
    discountRate: 0,
    taxRate: 0.05,
    billingPeriod: "Project phase",
    currency: "USD",
    lines: [
      {
        id: "l1",
        description: "Analytics engineering",
        detail: "Attribution model and dashboard handover",
        unitPrice: 210,
        quantity: 40,
      },
    ],
    notes: "Final invoice for this engagement. Thank you.",
  },
];

// ── Money ───────────────────────────────────────────────────────────────────

/** All figures rounded to the cent at each step, the way a ledger would. */
const cents = (n: number) => Math.round(n * 100) / 100;

export function invoiceTotals(invoice: Invoice) {
  const subtotal = cents(
    invoice.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  );
  const discount = cents(subtotal * invoice.discountRate);
  const taxable = cents(subtotal - discount);
  const tax = cents(taxable * invoice.taxRate);
  return { subtotal, discount, tax, total: cents(taxable + tax) };
}

export const invoiceTotal = (invoice: Invoice) => invoiceTotals(invoice).total;

export const invoiceById = (id: string) => invoices.find((i) => i.id === id);

/** Filter tabs. Derived, so a tab can never be offered with nothing behind it. */
export const invoiceStatuses: InvoiceStatus[] = [
  ...new Set(invoices.map((i) => i.status)),
];

export const outstandingInvoices = invoices.filter((i) => i.status !== "Paid");

export const recurringInvoices = invoices.filter((i) => i.recurring);

export const billingSummary = {
  paidToDate: cents(
    invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + invoiceTotal(i), 0)
  ),
  outstanding: cents(outstandingInvoices.reduce((s, i) => s + invoiceTotal(i), 0)),
  paidCount: invoices.filter((i) => i.status === "Paid").length,
  pendingCount: outstandingInvoices.length,
  overdueCount: invoices.filter((i) => i.status === "Overdue").length,
  /** Earliest unpaid due date — what the overview counts down to. */
  nextDue: [...outstandingInvoices].sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0],
};

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const moneyCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
