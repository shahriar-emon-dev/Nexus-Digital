# Database migrations

Ordered SQL migrations for the Nexus platform.

## Running them

**Every file is idempotent — safe to run more than once.** Re-running a
migration re-asserts the schema rather than failing on objects that already
exist, so pasting one into the Supabase SQL Editor after it has already been
applied is harmless.

Apply in filename order. `0000` must run first: it creates
`private.record_migration`, which every later file calls.

Either paste into **Supabase Dashboard → SQL Editor → Run**, or use the CLI:

```bash
supabase db push
```

## Tracking

Each migration records itself in `public.schema_migrations` on success:

```sql
select version, name, applied_at, applied_by
  from public.schema_migrations
 order by version;
```

The timestamp is the *first* successful application — re-running a file does
not overwrite it, because that row is the audit trail.

Supabase also keeps its own record in `supabase_migrations.schema_migrations`,
but only for migrations applied through the CLI or management API. Anything run
from the SQL Editor bypasses it, which is why this registry exists.

## Files

| Version | Name | Feature |
|---|---|---|
| `0000` | `migration_registry` | Registry table and `private.record_migration` |
| `0001` | `authentication` | `profiles`, `roles`, RLS, signup trigger, privilege guard |

## Conventions

- `SECURITY DEFINER` functions live in **`private`**, never `public`. Every
  function in `public` is published by PostgREST as `/rest/v1/rpc/<name>`.
- Every table gets RLS enabled plus explicit policies. An event trigger
  (`rls_auto_enable`) enables RLS automatically on new `public` tables, so a
  table without policies is unreachable rather than open — but state the
  policies anyway.
- Wrap `auth.uid()` in a scalar subquery (`(select auth.uid())`) inside
  policies so the planner evaluates it once per statement, not once per row.
- Never trust `raw_user_meta_data` for anything privilege-bearing. It is
  attacker-controlled on a public signup endpoint.
