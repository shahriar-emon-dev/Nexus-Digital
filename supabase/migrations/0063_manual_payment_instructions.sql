-- =============================================================================
-- 0063_manual_payment_instructions.sql
--
-- Payments are collected by hand, so the invoice screen has to tell a client
-- HOW to pay. Those details were hardcoded in PaymentPanel.tsx — "Digital
-- Federal Trust", SWIFT DFTBUS33XXX, account ••••8842 — none of which belongs
-- to this agency, sitting inside a credit-card form that was never rendered at
-- all (the invoice page imports only PrintButton from that file).
--
-- Bank details are business data an administrator edits, never a literal in
-- JSX. They are also NOT added to `public_site_settings`, the anon-facing view
-- from 0060: these are for a signed-in client looking at their own invoice, not
-- for the public internet.
--
-- SAFE TO RE-RUN. Requires 0021 (invoices), 0023 (site_settings), 0062.
-- =============================================================================

alter table public.site_settings
  add column if not exists payment_instructions text,
  add column if not exists payment_reference_hint text;

comment on column public.site_settings.payment_instructions is
  'Free-text bank/transfer details shown to a client on an unpaid invoice. '
  'Rendered as plain text, never as HTML, so it cannot become an injection point.';
comment on column public.site_settings.payment_reference_hint is
  'What the client should quote when paying, e.g. "the invoice number".';

/**
 * A client telling the agency they have paid.
 *
 * Creates a payment_intent in `requires_payment` — deliberately NOT settled.
 * A client asserting payment is a claim, not a reconciliation; an administrator
 * confirms it against the bank and calls settle_payment_intent(), which is the
 * only path that writes to the ledger. Letting this mark an invoice paid would
 * mean anybody with a login could clear their own balance.
 *
 * The amount is read from `invoice_totals` rather than accepted as an argument,
 * so a crafted request cannot declare $1 against a $12,000 invoice.
 */
create or replace function public.declare_payment(
  p_invoice uuid, p_reference text default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_amount numeric(12,2);
  v_currency char(3);
  v_key text;
  v_id uuid;
begin
  if not private.can_see_invoice(p_invoice) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  select t.outstanding, i.currency into v_amount, v_currency
    from public.invoice_totals t
    join public.invoices i on i.id = t.invoice_id
   where t.invoice_id = p_invoice;

  if v_amount is null or v_amount <= 0 then
    raise exception 'nothing outstanding on this invoice' using errcode = 'check_violation';
  end if;

  -- One declaration per payer per invoice. Pressing the button twice updates
  -- the reference rather than opening a second claim for finance to reconcile.
  v_key := 'declared:' || p_invoice::text || ':' || (select auth.uid())::text;

  insert into public.payment_intents
    (invoice_id, amount, currency, state, provider, provider_ref, idempotency_key, created_by)
  values
    (p_invoice, v_amount, coalesce(v_currency,'USD'), 'requires_payment', 'manual',
     nullif(btrim(coalesce(p_reference,'')), ''), v_key, (select auth.uid()))
  on conflict (idempotency_key) do update
     set provider_ref = coalesce(nullif(btrim(coalesce(p_reference,'')),''),
                                 public.payment_intents.provider_ref),
         updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.declare_payment(uuid, text) from public, anon;
grant execute on function public.declare_payment(uuid, text) to authenticated;

select private.record_migration('0063', 'manual_payment_instructions');
