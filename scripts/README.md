# Verification scripts

```bash
npm run verify      # checks + typecheck + lint
npm run check       # just the four contract checks (< 1s, no deps, no database)
npm run verify:full # verify + build + end-to-end
```

Run `npm run verify` before every deploy. It is fast enough to run on save.
`tests/README.md` covers the suites that need a browser or a database.

---

## Why these four exist

Each one closes a class of bug that **actually shipped in this repository**, and
that `tsc --noEmit`, ESLint and `next build` all structurally cannot catch.

### `check:schema` — column names in `.select()`

`supabase-js` type-checks select strings only for simple shapes; anything it
cannot parse degrades to `any` rather than to an error. So a renamed column
compiles, builds, and throws in the browser.

Caught in this repo:

| Where | Wrote | Column actually is |
|---|---|---|
| `lib/supabase/dashboard-queries.ts` | `invoice_payments.received_at` | `paid_at` |
| `app/client/invoices/payments/page.tsx` | `invoice_payments.paid_on` | `paid_at` |

The second had been live and would have thrown on every visit to
**Client → Invoices → Payments**.

Compares every `.from(t).select("…")` against the `Row` blocks in
`lib/supabase/types.ts`. **If a migration renames a column, regenerate the types
first** — a stale types file is itself the thing this check is warning about.

Embedded resources (`invoice:invoices ( number )`) are skipped: they name a
relation, not a column of the parent, and resolving them needs FK metadata this
script deliberately does not load.

### `check:server-exports` — what a `"use server"` module may export

Next allows **only async functions**. Exporting a constant compiles cleanly,
runs fine in dev, and fails `next build` minutes in, during page-data
collection, naming the importing *route* rather than the offending module.

Caught in this repo: `WEEKDAYS` exported from `availability-actions.ts`. It now
lives in `lib/weekdays.ts` — that is the fix pattern for any constant.

### `check:onconflict` — upserts that cannot succeed

`.upsert(row, { onConflict: "a,b" })` requires a real unique constraint on
`(a, b)`. Without one Postgres raises **42P10 on every call** — the write never
lands, and the only symptom is a table that stays empty and looks unused.

Caught in this repo: `saveAssignment()` upserted on
`project_id,profile_id` with no such constraint. **Staff allocation had never
once worked**, behind a complete 20 KB UI. Found by reading `pg_constraint` by
hand; migration `0061` adds the constraint.

Parses `supabase/migrations/*.sql` for `primary key (…)`, `unique (…)` and
`create unique index … (…)`, and matches column sets order-insensitively.

### `check:migrations` — the ledger describes the files

Every migration ends with `select private.record_migration('0061', 'name')`,
and `public.schema_migrations` is what the admin Database screen — and anyone
asking "is production current?" — reads. That row is written by hand, by whoever
copied the previous migration as a starting point, which is exactly how
`0063_manual_payment_instructions.sql` ends up recording itself as `0062`.

Nothing fails when it does. The migration applies, the ledger lies, and the next
person comparing disk against database chases a migration that ran fine.

Asserts the recorded version and name match the filename, numbering is
contiguous with no gaps or duplicates, `0000` exists, and every file records
itself.

Its companion needs a connection and so is not part of `npm run check`:

```bash
node scripts/migration-drift-sql.mjs | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f -
```

That answers the other half — has what is on disk actually been *applied*, and
has anything been applied that is not on disk? The expected list is generated
from the directory at run time rather than checked in, because a checked-in copy
of a directory listing goes stale the first time someone forgets to update it,
and a check that cries wolf gets disabled.

---

## Design notes

**No dependencies, no database, no server.** These run offline in under a
second, which is the only reason they get run at all. A check that needs a
seeded database and a dev server is a check that gets skipped.

**They are tested.** Each was verified by reintroducing its bug and confirming
the check fails, then restoring and confirming it passes. A check nobody has
watched fail is not known to work.

**False positives were fixed, not tolerated.** The schema check first reported
four phantom failures because its matcher spanned from one statement's
`.from()` into the next statement's `.select()`. The matcher now refuses to
cross another `.from(` or `.rpc(`. A check that cries wolf gets disabled.

---

## What these do *not* cover

They are static contract checks, not tests. They say nothing about whether a
workflow is correct — only that it cannot fail in four specific mechanical ways.

The suites that do cover behaviour now exist and are documented in
`tests/README.md`:

- **`tests/e2e/`** — Playwright, 98 tests against a production build. The auth
  wall is generated from the route tree, so it cannot fall behind it.
- **`tests/rls/rls.test.sql`** — 31 assertions run as `anon`, `authenticated`
  and each portal, inside a transaction that rolls back.
- **`tests/db/public-rpc.test.sql`** — the two RPCs an anonymous visitor can
  call, plus a standing assertion that no `SECURITY INVOKER` function in
  `public` calls a `private` helper its caller may not execute. That trap had
  already sprung: it is what killed the contact form.

Still genuinely uncovered: authenticated browser journeys (no credential is
committed, and none should be), visual regression, and concurrency around
`FOR UPDATE SKIP LOCKED`.
