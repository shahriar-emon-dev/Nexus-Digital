# Implementation report — 8 August 2026

Follow-on to `docs/AUDIT.md`. 25 files changed, 1 migration applied to the live
Supabase project. **Verified by `tsc --noEmit` (0 errors), `next build`
(compiled successfully, 85/85 pages), `next lint` (0 errors), and live SQL
verification of every database change.**

---

## 1. How this was verified

The audit's biggest limitation was that I could not build or run the project —
the device-side Linux workspace fails to start on this machine, so nothing was
executable. That was solved before writing any code:

- The full source tree was copied into this session's cloud container.
- `npm install` there (420 packages, clean).
- **`npx tsc --noEmit` was established as a baseline gate and came back clean on
  the untouched code**, then re-run after every change in this report.
- `NEXT_DIST_DIR=.next-build npx next build` was run twice — once mid-way and
  once at the end. Both compiled successfully. This catches React Server
  Component boundary errors that `tsc` cannot see, which mattered because
  `RevenueChart` became an async server component and `NotificationBell` began
  calling server actions from a client component.
- Google Fonts is not reachable from this sandbox, so `next/font/google` was
  temporarily stubbed for the build runs only. **The stub was reverted and the
  delivered `app/layout.tsx` is byte-identical to the original** — it is not in
  the changed-files list below.

Every database claim was verified with read-only SQL after the migration ran.

---

## 2. What was found while implementing that the audit missed

**A live bug in staff allocation.** `saveAssignment()` in `lib/supabase/staff-actions.ts`
has always called `.upsert(..., { onConflict: "project_id,profile_id" })`, and no
unique constraint existed on that pair. Postgres rejects that with `42P10` —
*"there is no unique or exclusion constraint matching the ON CONFLICT
specification"*. **The staff allocation feature has never once succeeded**, which
is the actual reason `project_assignments` had zero rows despite a complete
20 KB allocation UI. The audit had marked that table as fully working because
the code contained an upsert; it did not check that the upsert was executable.

Fixed in migration `0061`. This is a good argument for the E2E tests listed as
remaining work below — static reading cannot catch this class of defect.

---

## 3. Database changes

One migration, `supabase/migrations/0061_assignment_scoped_staff_access.sql`,
applied to project `wiajwelffyzfeznlftcy` and recorded in `public.schema_migrations`
(now 62 rows, matching 62 files on disk).

| Change | Why |
|---|---|
| `private.current_role_level()` — new | Reads `roles.level` for the caller. Lets visibility depend on seniority without hardcoding role ids. |
| `private.is_assigned_to_project(uuid)` — new | Live assignment check. Expiry evaluated **on read**, so a rolled-off contractor loses access without a cron job. |
| `private.can_see_project(uuid)` — rewritten | Was `... or current_portal() = 'STAFF'`, i.e. every staff member saw every project and every file, deliverable, meeting and time entry hanging off it. Now: admin, owning client org, project lead, **assigned staff**, or staff at role tier ≥ 3. |
| `projects_select` policy — rewritten | Mirrors the above, inlined so the planner can push org/lead comparisons into the scan. |
| `project_milestones` insert/update/delete — rewritten | Were admin-only, which is why no milestone could be created from the staff portal. Now open to staff who can see the project. |
| `project_assignments` unique `(project_id, profile_id)` — new | Fixes the `42P10` bug above. Includes a defensive de-duplication step so it cannot fail on a populated database. |
| `private.in_channel()` — rewritten | `auth.uid()` wrapped in a scalar subquery. Migration 0054 did this for policy predicates and missed the function bodies those predicates call. |
| `project_milestones` → realtime publication | The one project child not published; the client Milestone Roadmap and "Next Milestone" KPI could not update live. |
| Backfill: 2 `project_assignments` rows | Access-neutral. Without it, tightening the predicate would have removed the existing Senior Specialist's access to both live projects and looked like a regression. |

**Verified live after apply:** both helper functions exist; `projects_select`
carries the new predicate; `project_milestones` has 4 policies; 2 assignments
present; `project_milestones` in the publication; unique constraint present.
**Security advisors: unchanged — no new findings introduced.**

---

## 4. The missing create paths (P0 + P1-1 … P1-4)

The audit's central finding was that five subsystems had read/update/delete and
no create. All five now have one. **Notably, no migration was needed for four of
them** — the `INSERT` RLS policies already existed on `message_channels`,
`channel_participants`, `project_tasks`, `deliverables` and `deliverable_versions`.
The database was ready; only the server actions were missing.

| # | New action | File | Unblocks |
|---|---|---|---|
| **P0-1** | `setProfileOrganization()`, `listOrganizationOptions()`, and `assignPortalAndRole()` extended to accept an organisation | `profile-actions.ts` | **The entire client portal.** Nothing had ever written `profiles.organization_id`, the column every client RLS policy resolves through. |
| **P1-1** | `createChannel()`, `addParticipants()`, `ensureProjectChannel()`, `listChannelCandidates()` | `message-actions.ts` | All messaging, both portals. |
| **P1-2** | `createTask()`, `updateTask()`, `deleteTask()` | `task-actions.ts` | The staff Kanban board, which could previously only move pre-seeded cards. |
| **P1-3** | `createMilestone()`, `updateMilestone()`, `setMilestoneStatus()`, `deleteMilestone()`, `listProjectMilestones()` | `milestone-actions.ts` *(new)* | Client Milestone Roadmap, project timeline, and the "Next Milestone" KPI. |
| **P1-4** | `createDeliverable()`, `addDeliverableVersion()` | `deliverable-actions.ts` | The client review/annotation/approval loop. |
| **P1-13** | `convertLeadToClient()` | `lead-actions.ts` | The lead → client hand-off at the centre of the pipeline. Sets `leads.organization_id`, which nothing had ever written. |

Design decisions worth flagging:

- **`setProfileOrganization` forces `portal = 'CLIENT'`.** Attaching an
  organisation to a STAFF profile would widen that person's project visibility
  through `organization_id = current_org_id()` — a privilege escalation dressed
  up as an admin convenience.
- **`createChannel` always enrols its creator, and rolls back if participant
  insertion fails.** The select policy is `in_channel()`, so a channel whose
  creator was not a participant would be invisible to everyone including them.
- **`createProject` now calls `ensureProjectChannel`.** Clients cannot create
  channels by policy, so without this a client's Messages tab would be
  permanently empty with no affordance to fix it.
- **`createDeliverable` creates its first version atomically**, rolling back
  otherwise — a deliverable with no version renders as an empty review canvas.
- **`convertLeadToClient` is idempotent** — a lead already carrying an
  organisation returns it rather than creating a duplicate account.

---

## 5. Removing the fake and the dead

| Finding | Was | Now |
|---|---|---|
| **P1-5** `RevenueChart` | Two hardcoded arrays (~$628k of invented revenue) on `/admin`, over an `invoice_payments` table with zero rows | Async server component reading new `getRevenueSeries()`, which sums **payments received** by month, excludes voided invoices, keeps empty months as real zeros, and yields to an empty state when nothing has been collected. The "Monthly/Daily" toggle was **removed rather than reimplemented** — a daily payment breakdown is not a figure this business needs on its landing page. |
| **P1-6** `/services` | Fully hardcoded bento of three invented pillars; its only links were `/book-meeting`, `/case-studies`, `/contact`. **Zero links to any of the 5 published service pages.** | Renders the real catalogue via new `listServiceCatalogue()` — title, category, summary, price, lead time, cover image, featured badge — each card linking to `/services/[slug]`. Ordered featured → `display_order` → alphabetical, so admin reordering shows publicly without a deploy. Empty state when nothing is published. |
| **P2-1** `NotificationBell` | Took a prop defaulting to `[]`; `DashboardHeader` defaulted it too and **no caller on any of 31 screens ever passed one**. Four DB triggers wrote notifications nobody could see. | Loads its own inbox and subscribes to `notifications` over realtime. Mark-read and mark-all-read now **persist** instead of only mutating local state. Correct on every screen at once, with no prop to forget. |
| **P2-7** blog `NewsletterPanel` | `// TODO: POST to a real list. Nothing leaves the browser today.` | Calls `subscribeToNewsletter(email, "blog")` — the same action the footer had been using correctly all along. |
| **M-7** "Run System Audit" | Primary button on `/admin`, no handler | Replaced with links to the two screens that perform the checks it implied: Database health and Audit trail. |
| **M-7** "Continue with Google" | `type="button"`, no handler, under a divider reading "Or enterprise SSO". `signInWithOAuth` appears nowhere in the codebase. | Removed, with a comment stating it should return only alongside a configured provider. Dead `GoogleMark` SVG removed too. |

Also cleaned: five pre-existing unused imports flagged by lint.

---

## 6. New UI so the new actions are reachable

An action nobody can invoke is not a fix.

- **`app/admin/settings/users/UsersTable.tsx`** — the Organisation column was a
  read-only label. It is now a picker calling `setProfileOrganization`, with
  optimistic update and rollback. **This is what actually completes P0-1.**
- **`app/staff/projects/NewTaskDialog.tsx`** *(new)* — "New task" on the staff
  board. Project, column, discipline, assignee, description, urgent flag.
  Project is required rather than inferred, because the board spans every
  project the caller can see and guessing would file work against the wrong one.
- **`app/staff/messages/NewChannelDialog.tsx`** *(new)* — "New conversation".
  Name, purpose, optional project, multi-select participants. Staff/admin only,
  matching the insert policy.

---

## 7. Verification summary

| Gate | Result |
|---|---|
| `tsc --noEmit` baseline (before changes) | 0 errors |
| `tsc --noEmit` after every change | 0 errors |
| `next build` | ✓ Compiled successfully · 85/85 static pages |
| `next lint` | 0 errors, 12 warnings (all pre-existing; 5 fixed) |
| Migration applied | `success: true`, recorded as 0061 |
| Post-migration SQL verification | All 6 assertions passed |
| Supabase security advisors | Unchanged — no new findings |

---

## 8. What was NOT done, honestly

This session closed the P0 and six of the thirteen P1s. It did **not** attempt
the rest, and none of the following should be read as done:

**Not started, requires external services (P1-10, P1-11):**
- **Email.** No provider integrated. Invoice sending, meeting confirmations and
  reminders, review requests, client welcome and staff invites all still depend
  on this and all still do nothing.
- **Payments.** `PaymentPanel` remains an explicit stub. No processor, no
  invoice PDF, no recurring invoices, no bKash/Nagad.

**Not started, substantial features (P1-9, P1-12, P2-17…19):**
- 2FA enrolment UI (`mfa.enroll` still appears nowhere — the verify flow remains
  unreachable).
- `/admin/meetings` — still no admin surface for the meetings module.
- Admin analytics charts (0 of the spec's 8), client campaign reports.
- Project templates.

**Partially addressed:**
- **P1-8 rate limiting** — not implemented. `@upstash/ratelimit` is still an
  unused dependency and `submit_lead` / `subscribe_newsletter` remain
  unthrottled `anon` RPCs.
- **P2-3/P2-4 route authorisation** — `routeModuleMap` still covers 11 of 36
  admin routes, and `slow_queries()` / `database_health()` are still executable
  by any authenticated user.
- **P2-2 / S-7 GA4 and custom scripts** — deliberately left alone. Emitting them
  without sanitisation and a CSP would convert a harmless dead field into stored
  XSS with full session access on every public page. These must be fixed
  together or not at all.
- **P2-5 `content_details`** — still has no write path, so
  `blog/shipping-on-the-edge` still has no excerpt, category or date, and still
  cannot be fixed from the admin.
- **Milestone and deliverable UI** — the server actions exist and are tested by
  the type system, but no dialog surfaces them yet. They are callable from code,
  not yet from the screen. Task and channel creation *did* get UI.

**New finding, not addressed:** `npm install` reports **next@14.2.3 has a known
security vulnerability** (see nextjs.org/blog/security-update-2025-12-11). This
should be upgraded before any production deployment. I did not change it here —
a framework bump needs its own verification pass.

**Still true from the audit:** there are no tests. The `42P10` allocation bug
existed for months behind a complete UI, and only surfaced because I read the
constraint list. Playwright is already a devDependency; five E2E tests over the
critical workflows would be the highest-value next investment.

---

## 9. Revised completion estimate

| | Before | After |
|---|---|---|
| Client portal | ~22% (blocked at root) | **~55%** — unblocked, but no milestone/deliverable authoring UI and no payments |
| Staff portal | ~48% | **~62%** — can create tasks and conversations; assignment-scoped |
| Admin portal | ~72% | **~76%** — real revenue, org linking, lead conversion |
| Public site | ~65% | **~72%** — services catalogue is real |
| **Overall** | **~52%** | **~62%** |

The remaining 38% is now dominated by two external integrations (email,
payments) rather than by missing internal plumbing. That is a materially better
position to be in: the next phase is wiring up vendors, not discovering more
holes.
