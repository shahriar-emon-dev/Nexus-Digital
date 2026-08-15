# Tests

Three suites, each answering a question the others cannot.

```bash
npm run verify    # static contract checks + typecheck + lint      (~20s, offline)
npm run e2e       # Playwright, against a production build         (~3min)
                  # RLS + RPC suites: psql, see below              (~2s)
```

| Suite | Where | Proves | Needs |
|---|---|---|---|
| `scripts/check-*.mjs` | `npm run check` | code and SQL agree about columns, exports, constraints, migration numbering | nothing |
| `tests/e2e/` | `npm run e2e` | the browser experience: routing, the auth wall, forms, structured data | a build + a server |
| `tests/rls/`, `tests/db/` | `psql` | the database refuses what it should, in the roles it should | a connection |

The last one is the one people skip and the one that matters most. Middleware
decides which *page* you may open. RLS decides which *rows* you may read — and
only RLS survives someone using the anon key directly, which is published in
the browser bundle by design.

---

## Database suites

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/rls/rls.test.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/db/public-rpc.test.sql
node scripts/migration-drift-sql.mjs | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f -
```

`DATABASE_URL` is the connection string from **Supabase → Project Settings →
Database**. Use the session pooler string, not the transaction pooler: these run
inside one transaction and `set local role` needs a session.

**Both suites are read-committed inside a single transaction that ends in
`ROLLBACK`.** They create their own organisations, users, projects and invoices,
assert against them, and leave nothing behind — safe to run against production,
and worth running there, because production is where the policies actually are.

A failure aborts with `P0004` and the name of the property that broke:

```
ERROR:  P0004: ISOLATION: a client can read another organisation invoice
```

### `tests/rls/rls.test.sql` — 31 assertions

Grouped by the guarantee they defend, not by table:

1. **Tenant isolation** — a client sees their own organisation's rows and none
   of another's, in both directions, and never a draft invoice.
2. **Writes** — reading is scoped; writing is refused outright.
3. **Privilege escalation** — `profiles_update` lets a user update their own
   row, so a trigger is the only thing between a client and
   `set portal = 'ADMIN'`. Four attempts, including the horizontal one
   (`set organization_id = <someone else's>`) that makes every isolation
   assertion above vacuous if it succeeds.
4. **Staff scoping** — migration 0061. Unassigned staff see nothing, assigned
   staff see one project, a level-3 lead sees all, and an *expired* assignment
   grants nothing.
5. **Admin reach** — the counterweight. Without it, "deny everything" passes.
6. **Anonymous** — what the published key can read. Zero invoices, projects,
   organisations, leads, audit rows, unpublished profiles.

### `tests/db/public-rpc.test.sql`

The two functions an anonymous visitor can call. Five enquiries succeed, the
sixth is refused, a different address is a different bucket, and the limiter
itself is unreachable.

It also asserts the *class* of bug rather than one instance: every
`SECURITY INVOKER` function in `public` is checked against the `private.*`
helpers it calls, and the caller must be able to execute all of them. That trap
is what broke the contact form (see below).

---

## End-to-end

```bash
npm run build && npm run e2e     # or: npm run verify:full
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run e2e   # against a server you started
npm run e2e:report               # open the HTML report after a CI run
```

Against a **production build**, never `next dev`. Three failures this repository
has actually shipped — a constant exported from a `"use server"` module, an RSC
boundary violation, a client component importing a server-only helper — are
invisible in dev and appear only after `next build`.

**98 tests.** The bulk is generated: `tests/e2e/routes.ts` walks `app/` and emits
one auth-wall assertion per page under `/admin`, `/staff` and `/client`. A new
route is covered the moment the folder exists — which matters, because the gap
this suite exists to close was created by a hand-maintained list that fell
behind the route tree.

Each of those checks three things, and the third is the point:

1. the response redirects to `/auth/login`
2. `?next=` preserves the destination
3. **no portal chrome appears in the delivered HTML** — a page that streams its
   shell before the redirect resolves has already leaked, and a test that only
   reads `page.url()` after settling would call that a pass

### Two tiers

Some assertions need the database; most do not. `tests/e2e/backend.ts` probes the
Supabase project once and **skips the data tier loudly** if it is unreachable:

```
3 skipped   Supabase project unreachable from this runner — data-tier assertion
            not executed.
```

A skip is not a pass. If you see those three skips on a machine that should have
a connection, check `NEXT_PUBLIC_SUPABASE_URL` and your egress before believing
the green.

### It writes one row

`enquiry.spec.ts` submits a real enquiry, because that is the only workflow an
anonymous visitor can drive all the way into the database. The address is unique
per run. Clean up with:

```sql
delete from public.email_outbox where payload->>'email' like 'e2e+%@nexus.test';
delete from public.leads where email like 'e2e+%@nexus.test';
```

### Environment escape hatches

| Variable | Effect |
|---|---|
| `PLAYWRIGHT_BASE_URL` | test an already-running server; the managed `webServer` steps aside |
| `PLAYWRIGHT_CHROMIUM_PATH` | use a Chromium that does not match Playwright's pinned revision |
| `CI` | retries, 2 workers, HTML report, `forbidOnly` |

---

## What these found

Written down because a test suite's worth is measured in bugs, not in count.

**The public contact form was dead.** Migration 0062 added rate limiting to
`submit_lead` and never granted `EXECUTE` on the limiter. `submit_lead` was
`SECURITY INVOKER`, so the call ran as `anon`, and every submission since failed
with `42501: permission denied for function consume_rate_limit`. The newsletter
signup failed the same way. The only symptom was an empty `leads` table — which
looks exactly like a quiet week. Found by `tests/db/public-rpc.test.sql` calling
the function as `anon`, the way the website does. Fixed in 0064, then reworked in
0065 so the limiter stays sealed and the entry points stay `SECURITY INVOKER`.

**A raw parser error reached the sign-in form.** With the auth host unreachable,
`supabase-js` tried to parse an intermediary's plain-text reply as JSON and
`error.message` — passed straight through to the UI — read
`Unexpected token 'H', "Host not i"... is not valid JSON`. Someone seeing that
assumes they mistyped. `lib/supabase/auth-errors.ts` now rewrites transport
failures and leaves credential errors alone, because Supabase's identical
message for "unknown email" and "wrong password" is deliberate — rewording it
would turn the form into an account-enumeration oracle.

**No icon existed.** `/favicon.ico`, `/icon.png` and `/apple-icon.png` all 404'd,
on every page load, in every browser. Found by the same-origin asset check.

**The image optimiser was an open proxy.** `remotePatterns` was
`hostname: '**'`, so `/_next/image?url=https://anything/...` would serve a third
party's bytes from this domain, on this bandwidth. Now an explicit list.

## Negative controls

Each check was watched failing before it was trusted:

| Check | Broken deliberately by | Reported |
|---|---|---|
| auth wall | adding `/about` to the protected list | `/about did not redirect to the sign-in page` |
| RLS isolation | `create policy invoices_select … using (true)` inside the transaction | `ISOLATION: a client can read another organisation invoice` |
| migration ledger | `record_migration('0062', …)` in `0063_*.sql` | `records version '0062', filename says '0063'` |
| schema contract | renaming a column in a `.select()` | the column, the file and the line |

A check nobody has watched fail is not known to work.

## Not covered

- **Authenticated browser journeys.** Signing in through the UI needs a real
  credential; none is committed, and none should be. The RLS suite covers the
  authorisation half at the layer that enforces it.
- **Visual regression.** No screenshot baselines.
- **Load and concurrency.** `settle_payment_intent` and `claim_emails` use
  `FOR UPDATE SKIP LOCKED` and are correct by construction, not by test.
