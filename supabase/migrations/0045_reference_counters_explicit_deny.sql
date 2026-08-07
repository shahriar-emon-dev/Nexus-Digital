-- =============================================================================
-- 0045_reference_counters_explicit_deny.sql
--
-- Silences an RLS-enabled-no-policy lint, and makes the intent explicit.
--
-- private.reference_counters had RLS enabled and no policies at all. That is
-- already deny-all in PostgreSQL, so the behaviour does not change here — but
-- "no policy" reads as an oversight, and the next person to see the lint could
-- reasonably fix it by adding a permissive policy. The table backs the
-- monotonic counters behind project and lead references; a writable counter can
-- be rewound, and a rewound counter reissues a reference that already belongs
-- to something else. That was the bug 0038 existed to fix.
--
-- So the policy is written down and says false, rather than being implied by
-- absence. The functions that issue references are SECURITY DEFINER and run as
-- the owner, which RLS does not apply to — they keep working.
--
-- Verified after applying: references still assign (counter advanced to 11).
--
-- SAFE TO RE-RUN. Requires 0038.
-- =============================================================================

alter table private.reference_counters enable row level security;

drop policy if exists reference_counters_no_direct_access on private.reference_counters;

create policy reference_counters_no_direct_access on private.reference_counters
  for all
  using (false)
  with check (false);

comment on table private.reference_counters is
  'Monotonic per-prefix counters. Deny-all by policy: reachable only through '
  'the SECURITY DEFINER functions that issue references, never directly. '
  'Rewinding one of these would let a retired reference be reissued.';

select private.record_migration('0045', 'reference_counters_explicit_deny');
