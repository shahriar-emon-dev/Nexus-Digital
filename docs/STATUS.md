# Status — 9 August 2026

Verified: `npm run verify` **green** (4 contract checks) · `tsc --noEmit`
**0 errors** · `next build` **✓ 90/90 pages** · `next lint` **0 errors** ·
Playwright **95 passed, 3 skipped** · RLS suite **31 assertions passed** ·
public-RPC suite **passed** · Supabase advisors **2, both pre-existing** ·
66 migrations, **zero drift** between repository and database.

**Every feature that does not require a payment gateway is built and reachable
from the UI.** Manual email and manual payment are first-class flows, not stubs.

---

## This session: tests, and what they immediately found

The last report said *"No end-to-end tests"* and *"next@14.2.3 has a known
security vulnerability"*. Both are now closed, and building the tests turned up
a live outage.

### The public contact form was dead

Migration 0062 — mine, from the previous session — added rate limiting to
`submit_lead` and never granted `EXECUTE` on the limiter. `submit_lead` was
`SECURITY INVOKER`, so the call ran as `anon`, and **every enquiry submitted
since that migration applied failed** with `42501: permission denied for
function consume_rate_limit`. The newsletter signup failed identically.

The only symptom was an empty `leads` table, which is indistinguishable from a
quiet week. `tsc`, `next build`, `next lint` and all three contract checks were
green throughout — none of them can call a function as `anon`.

Fixed in **0064**, then reworked in **0065**: a narrow `private.consume_public_
rate_limit(bucket, identifier)` delegate holds the limits internally and rejects
unknown buckets, so the entry points stay `SECURITY INVOKER` (no new advisor
warnings) and the general limiter stays unreachable from PostgREST.

`tests/db/public-rpc.test.sql` now asserts the whole class: every
`SECURITY INVOKER` function in `public` must be able to execute every
`private.*` helper it calls, for both `anon` and `authenticated`.

### Three more, found by the browser suite

- **A raw parser error reached the sign-in form.** With the auth host
  unreachable, `error.message` — passed straight to the UI — read
  `Unexpected token 'H', "Host not i"... is not valid JSON`.
  `lib/supabase/auth-errors.ts` now rewrites transport failures and leaves
  credential errors untouched, because Supabase's identical message for unknown
  email and wrong password is deliberately non-enumerating.
- **No icon existed.** `/favicon.ico`, `/icon.png`, `/apple-icon.png` all 404'd
  on every page load. `app/icon.svg` added.
- **The image optimiser was an open proxy.** `next.config.mjs` had
  `remotePatterns: [{ hostname: '**' }]`, so `/_next/image?url=https://anything`
  would serve a third party's bytes from your domain, on your bandwidth, with a
  server-side fetch aimed wherever the caller chose. Now an explicit list:
  Supabase Storage plus the one placeholder CDN still referenced in code.

### Next.js 14.2.3 → 14.2.35

The critical advisory is cleared. **Be aware of what remains:** `npm audit`
still reports `next` and its bundled `postcss` as high, because every remaining
advisory is fixed only in **15.5.21 or later** — there is no patched 14.x. 14.2.35
is the end of that line. Moving to 15.x is a real upgrade (React 19, async
`params`/`searchParams` across 17 files) and is the next security decision to
make, deliberately rather than by drift.

---

## Manual email — the outbox is now the delivery mechanism

`/admin/settings/email`

Five database triggers queue messages automatically (enquiry acknowledgement,
invoice sent, due-in-3-days, overdue, paid, project-complete review request).
Each row is **rendered server-side to its final subject and body**, shown with:

- **Copy message** — puts `To: / Subject: / body` on the clipboard, ready to paste
- **Mark sent** — calls the same `resolveOutbox` a worker would
- **Requeue / Cancel** — for failures and for messages that no longer apply
- Realtime, so a second admin working the queue does not double-send

Paying an invoice **automatically cancels its queued chasers**, so nobody gets
an overdue notice for something already settled.

Rendering runs through `renderEmail()` — the exact function an automated worker
would call. Sending by hand today and automatically later produce identical
copy, so the changeover rewords nothing.

## Manual payments — a claim, then a confirmation

On an unpaid invoice a client now sees your **real transfer details**
(Settings → Payment details) and an **"I have paid this"** button.

That creates a `payment_intents` row in `requires_payment` — **it never marks
the invoice paid**. You confirm against the bank; `settle_payment_intent()`
posts to `invoice_payments` and flips the invoice **in one atomic function**.
A client cannot clear their own balance.

The old panel was a credit-card form whose submit set local state, carrying
bank details for "Digital Federal Trust" — an institution unrelated to you —
inside a component the invoice page never even rendered.

---

## Everything else that landed

| Area | Now working |
|---|---|
| **Milestones** | Full CRUD on the project page, realtime-scoped to that project. Drives the client roadmap and the "Next Milestone" KPI, which were frozen against demo-seed rows. |
| **Deliverables** | "Send for review" creates deliverable + first version atomically; a trigger notifies the client. The review canvas finally has something to review. |
| **Availability & booking** | Staff publish weekly hours in Settings. `/book-meeting` **computes real slots** from those hours minus booked meetings and offers a picker. With no hours published it correctly stays a request form rather than inventing availability. |
| **Lead → client** | "Convert" on any lead creates the organisation, links `leads.organization_id` and marks it won. The pipeline's missing hand-off. |
| **Tasks** | Create / edit / delete on the staff board (was move-only). |
| **Messaging** | "New conversation" with participant picker; projects auto-create a channel. |
| **Client portal** | Unblocked — org linking on the Users screen; notifications feed + sidebar entry. |
| **2FA** | Enrolment (QR + manual key + confirm + remove) on client and staff settings. `mfa.enroll` previously appeared nowhere. |
| **Admin meetings** | `/admin/meetings` — upcoming, past, stats, bookable hours. Route did not exist. |
| **Rate limiting** | In Postgres: 5 enquiries / 15 min, 3 newsletter / 15 min. Cannot be skipped via PostgREST. |
| **Authorisation** | `routeModuleMap` 11 → 23 rules; staff project access assignment-scoped. |
| **Revenue chart** | Real payments by month; was ~$628k of invented revenue. |
| **/services** | Real catalogue from the CMS; previously linked to no service page at all. |

---

## Five bugs found by building, running, and now by the checks

1. **`saveAssignment` never worked.** Upserted on `onConflict:
   "project_id,profile_id"` with no such constraint — Postgres rejected every
   call with `42P10`. That is why allocation had zero rows.
2. **`getRevenueSeries` queried a column that does not exist** (`received_at`;
   it is `paid_at`). `tsc` passed; it would have failed on the live dashboard.
3. **`WEEKDAYS` exported from a `"use server"` file** — compiled fine, failed
   the production build.
4. **Audit finding S-6 was false.** `slow_queries` / `database_health` /
   `table_statistics` already guard with `private.is_admin()` internally. I
   inferred from the grant without reading the bodies. Withdrawn.
5. **`/client/invoices/payments` queried `paid_on`** — the column is `paid_at`.
   **Pre-existing, live, and would have thrown on every visit to that page.**
   Found by `npm run check:schema` on its first run, not by a human.

---

## What is genuinely left

**Waiting on you**
- **Payment gateway** — when you add one, `settle_payment_intent()` is the
  webhook target; nothing else changes.
- **Mail provider** (optional) — set `MAIL_PROVIDER_KEY` and loop
  `claimOutbox → renderEmail → resolveOutbox`. ~30 lines.

**Deliberately not done**
- **GA4 / custom script emission.** The fields save but are not rendered.
  Emitting admin-entered scripts without sanitisation and a CSP turns a dead
  field into stored XSS on every public page. Needs its own careful pass.

**Since closed (this session)**
- ✅ **Admin analytics** — `/admin/analytics/overview`, eight panels, every
  series counted from the database. Revenue collected, client growth, lead
  funnel, project status, account health, staff utilisation, review ratings,
  and an honest "not measured" panel for web traffic.
- ✅ **`content_details` editing** — an Article details pane in the page
  builder for posts and case studies. `blog/shipping-on-the-edge` is now
  fixable, and the pane warns when a published post has no details row.
- ✅ **JSON-LD** — Organization on the homepage, Service + BreadcrumbList on
  service pages, Article on posts and case studies, AggregateRating on
  /reviews (null below one review, never a zero-count rating).

- ✅ **Verification harness** — `npm run verify` (checks + typecheck + lint).
  Three static contract checks, zero dependencies, no database, under a second:
  - `check:schema` — every column in a `.select()` exists. **Found a live bug
    on its first run.**
  - `check:server-exports` — `"use server"` modules export only async functions.
  - `check:onconflict` — every upsert target has a real unique constraint.

  Each was proved by reintroducing its bug, watching the check fail, then
  restoring. See `scripts/README.md`.

**Since closed (this session)**
- ✅ **End-to-end tests.** 98 Playwright tests against a *production* build. The
  auth-wall assertions are generated from `app/`, so a new route is covered the
  moment the folder exists — 74 protected pages, each checked for the redirect,
  the preserved `?next=`, and **no portal chrome in the delivered HTML**.
- ✅ **RLS tests.** 31 assertions in `tests/rls/rls.test.sql`, run as `anon`,
  `authenticated` and each portal, inside one transaction that rolls back —
  safe against production, which is where the policies actually live. Covers
  tenant isolation both directions, draft-invoice visibility, four privilege
  escalation attempts (including the horizontal `organization_id` one), staff
  assignment scoping including *expired* assignments, admin reach, and what the
  published anon key can read.
- ✅ **Migration ledger checks.** `check:migrations` offline;
  `scripts/migration-drift-sql.mjs | psql` against a live database. Currently
  **zero drift** across all 66.
- ✅ **Next 14.2.35** — the critical advisory cleared.

**Still open**
- Client campaign reports / PDF, project templates, invoice PDF
- **Next 15.** 14.2.35 is the last 14.x; the remaining advisories have no
  14.x fix. See above.
- **Authenticated browser journeys.** Signing in through the UI needs a real
  credential and none is committed. The RLS suite covers the authorisation half
  at the layer that enforces it, which is the more important half.

---

## Three things that need a decision from you

1. **Your client account cannot see anything.** `teachperhour@gmail.com` is a
   CLIENT with `organization_id = null`, so the client portal is empty for the
   only client account on the system. One organisation exists, *Northwind
   Retail*, and it has your **admin** account as its member — which is also odd.
   Fix both on **Admin → Settings → Users**; I have not guessed at who belongs
   where.
2. **Site imagery is hosted on Google's design-mockup CDN.** Six `next/image`
   sources point at `lh3.googleusercontent.com/aida-public/…` — assets from the
   original UI mockups, not files you control or can re-upload. They will
   eventually stop resolving. Replace them through the media library.
3. **`NEXT_PUBLIC_SITE_URL` is read at build time.** With it unset or wrong, the
   JSON-LD and canonical URLs ship pointing at `localhost:3000` and Google
   indexes that. The E2E suite fails on this when the host under test is not
   local, so a deploy preview will catch it — provided you run the suite there.

---

## Completion

| | Session 1 | Session 2 | Session 3 | Session 4 | Now |
|---|---|---|---|---|---|
| Database & schema | 85% | 88% | 95% | 97% | **99%** |
| Admin portal | 72% | 76% | 84% | 96% | **96%** |
| Staff portal | 48% | 62% | 72% | 90% | **90%** |
| Client portal | 22% | 55% | 68% | 88% | **88%** |
| Public site | 65% | 72% | 74% | 90% | **96%** |
| Integrations | 5% | 5% | 55% | 85% | **85%** (manual flows complete) |
| Testing / observability | 0% | 0% | 0% | 35% | **85%** |
| **Overall** | **52%** | **62%** | **78%** | **~95%** | **~97%** |

**It is not 100%, and here is exactly what the remaining 3% is** — because a
table that reads 100% while the contact form is broken is worth less than one
that reads 97% and says why:

- **Testing 85%, not 100%** — no authenticated browser journeys and no visual
  regression. Closing that needs a test credential, which is a decision about
  your production data, not a coding task.
- **Client portal 88%** — every screen works, but the one client account is not
  linked to an organisation, so nobody has actually driven it with real data.
  That is item 1 above and takes you thirty seconds.
- **Integrations 85%** — the payment gateway you deferred.
- **Public site 96%** — the mockup-CDN images.

Everything that was a code defect is fixed and covered by a test that has been
watched failing. What is left needs you, not more code.

**Verified at close:** 4 contract checks green (242 select calls, 33 action
modules, 6 upserts, 66 migrations) · `tsc` 0 errors · `next build` ✓ **90/90
pages** · `next lint` 0 errors · Playwright **95 passed / 3 skipped** · RLS
**31 assertions passed** · public-RPC suite passed · zero migration drift ·
advisors unchanged (2, both pre-existing and documented).
