import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { getInvoice, listInvoices } from "@/lib/supabase/invoice-actions";
import { InvoicesTable } from "./InvoicesTable";

export const metadata: Metadata = { title: "Invoices" };

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const [invoices, orgsRes] = await Promise.all([
    listInvoices(),
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  // Line items and payments for the editor, fetched here so opening an invoice
  // is instant rather than a spinner over a second round trip.
  const details = await Promise.all(
    invoices.map(async (i) => {
      const d = await getInvoice(i.id);
      return [i.id, { lineItems: d?.lineItems ?? [], payments: d?.payments ?? [] }] as const;
    })
  );

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Invoices" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Invoices
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Subtotal, discount, tax, total and outstanding are all derived from
          the line items and recorded payments. No money is stored on the
          invoice itself, so a total can never disagree with what it is made of.
        </p>
      </header>

      <InvoicesTable
        initial={invoices}
        organizations={(orgsRes.data ?? []) as { id: string; name: string }[]}
        detail={Object.fromEntries(details)}
      />
    </div>
  );
}
