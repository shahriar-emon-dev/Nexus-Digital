# Nexus Digital Agency — Application, Requirements & Workflow Audit

**Repository:** `E:\agency` (branch `main`)
**Audit date:** 8 August 2026
**Method:** full static read of the repository (91 route files, ~60 server-action/query modules, 61 SQL migration files (0000–0060), all components and config) plus **read-only live queries against the production Supabase project** `wiajwelffyzfeznlftcy` (schema, RLS policies, functions, realtime publication, row counts, security/performance advisors).
**Scope note:** no code was changed. No writes were made to the database. Runtime browser testing was not performed (agreed scope: static + live DB reads), so findings about *rendering* are inferred from code and DB state, not from a running instance. Every such inference is marked.

---

## 0. The one-paragraph answer

The application is **architecturally much stronger than it is functionally complete.** The database is genuinely excellent — 51 tables, RLS enabled and populated with policies on every single one, derived-not-stored money, immutable audit trail enforced by trigger, a real permission matrix, and only two advisor findings in the entire project. The server-action layer is real: ~200 exported functions across 50 modules, virtually all of them actually reading and writing PostgreSQL. There is almost no cargo-cult mock data left; where something is not built, the codebase mostly says so out loud in a `NotInstrumented` panel rather than faking it.

What is missing is **the middle**: a set of specific, individually small *create* paths that were never written, and without which entire subsystems can never be started by a user. Messaging has no way to create a channel. Projects have no way to create a task or a milestone. Deliverables have no way to be uploaded. Most seriously, **nothing anywhere in the codebase writes `profiles.organization_id`**, which is the single value every client-portal RLS policy is scoped by — so the Client Portal, roughly a quarter of the application, is structurally unreachable with real data no matter what an administrator does in the UI. The live database confirms this: 40 of 51 tables have **zero rows** and every index on them is reported unused, meaning these features have never executed once, in any environment.

**Honest overall completion: ~52%.** Not "half-built" in the usual sense — closer to 85% of the foundation and 25% of the operational surface.

---

## 1. Executive summary & scores

| Dimension | Score | Basis |
|---|---|---|
| **Architecture** | **8.5 / 10** | Clean separation (route → server action → PostgREST → RLS). No business logic in components. Single realtime hook used consistently. Derived values genuinely derived. |
| **Database schema** | **8.5 / 10** | 51 tables, 61 migrations, correct FKs/indexes/constraints, views for money, triggers for audit and notification. Loses points for gaps listed in §9. |
| **Security (DB layer)** | **8 / 10** | RLS on 100% of tables; `SECURITY DEFINER` used correctly and revoked from `anon`; audit log immutable by trigger; no secrets in client code. |
| **Security (app layer)** | **5.5 / 10** | Route→module map covers 11 of 36 admin routes; no rate limiting despite the dependency being installed; no 2FA enrolment; staff tiers unenforced. |
| **Functional completion** | **4 / 10** | Missing create paths kill messaging, tasks, milestones, deliverables and the entire client portal. |
| **Realtime** | **6.5 / 10** | The hook is correct (a rare thing to get right) and 21 subscriptions exist. But several tables in the publication have no subscriber, and several subscribed tables have no data path to produce events. |
| **UI / UX** | **7 / 10** | Consistent, accessible-looking, deliberate empty states. Loses points for dead CTAs and one fabricated chart. |
| **Performance** | **7 / 10** | No N+1s found; `noStore()` used deliberately; some sequential awaits. Unmeasurable in practice — no data and no instrumentation. |
| **Requirements coverage vs spec v1.0** | **~45%** | See §23 matrix. |
| **Production readiness** | **2.5 / 10** | Cannot onboard a client. Cannot start a conversation. Cannot create a task. No email. No payments. |

### Completion by portal

| Portal | Routes | UI | Backend | DB | Realtime | Honest completion |
|---|---|---|---|---|---|---|
| Public website | 16 | 90% | 70% | 75% | n/a | **~65%** |
| Admin portal | 36 | 85% | 80% | 90% | 75% | **~72%** |
| Staff portal | 11 | 80% | 60% | 85% | 40% | **~48%** |
| Client portal | 23 | 85% | 55% | 85% | 35% | **~22%** (blocked at the root — see P0-1) |
| Auth | 5 | 90% | 85% | 95% | n/a | **~80%** |

---

## 2. Requirements documentation — what the application is *supposed* to be

Two requirement sources exist in the repository:

1. **`Nexus_Agency_Website_Specification_v1.0.docx`** (43 KB, 16 sections, "Approved for Development", May 2026) — the authoritative spec.
2. **`Nexus_Agency_Stitch_UI_Prompts.md`** (69 KB) — UI generation prompts, design-level only.

There is **no README, no `docs/` directory, no architecture document, and no API documentation.** `supabase/migrations/README.md` (2 KB) is the only engineering doc. For a system of this size that is itself a finding (P3).

### 2.1 Roles the spec defines vs roles the database has

| Spec role (§1.4, §9.3) | In database? | Evidence |
|---|---|---|
| Admin (Agency Owner/Manager) | ✅ `Global Admin` | `roles` table, 4 rows |
| Senior Staff / Team Lead | ⚠️ `Project Lead` | present but tier semantics unenforced |
| Specialist Staff | ⚠️ `Senior Specialist` | present; **"only their assigned projects" is NOT enforced** |
| Contractor / Freelance | ❌ **absent** | no such role |
| Buyer / Client | ❌ **no role row exists** | the live CLIENT user has `role_id = NULL` |
| Visitor | ✅ `anon` | correct |

Two roles exist that the spec never mentions: `Financial Auditor`, and `Project Lead` was renamed. This is a documented **conflict**, not necessarily wrong — but it means the spec's permission table and the shipped matrix cannot be reconciled without a decision.

**The permission matrix as actually deployed** (live query on `role_grants`, 24 rows, 6 modules × 4 roles):

| Module | Global Admin | Project Lead | Senior Specialist | Financial Auditor |
|---|---|---|---|---|
| content-publishing | full | admin | edit | none |
| crm-database | full | edit | edit | view |
| financial-systems | full | view | none | **admin** |
| security-policies | full | none | none | audit |
| service-management | full | admin | edit | none |
| staff-hr-records | full | edit | none | none |

This is a well-formed matrix, explicitly written (no implicit denials). It is the strongest part of the security design.

### 2.2 Technology stack — spec vs reality

The spec (§14.1) prescribes a stack the implementation does **not** use. This is the largest single requirements conflict in the project.

| Layer | Spec says | Actually built | Verdict |
|---|---|---|---|
| ORM | Prisma v5 | **none** — Supabase PostgREST + raw SQL migrations | Legitimate substitution |
| Auth | NextAuth.js v5 | **Supabase Auth** | Legitimate substitution |
| Real-time | Pusher / Socket.io | **Supabase Realtime** | Legitimate substitution |
| Cache/sessions | Redis (Upstash) | **not used** — `@upstash/ratelimit` + `@upstash/redis` are in `package.json` and imported **nowhere** | ⚠️ **Dead dependency; rate limiting (§15.1) is unimplemented** |
| Email | Resend + React Email | **nothing** — zero email code in the repository | ❌ **Missing** |
| Payments | Stripe + bKash/Nagad | **nothing** — `"Stripe"` appears only as an input `placeholder` | ❌ **Missing** |
| Charts | Recharts + Victory | hand-rolled SVG/CSS | Acceptable |
| Kanban DnD | dnd-kit | hand-rolled `KanbanBoard` | Acceptable |
| Rich text | Tiptap | block editor in `PageEditor.tsx` | Acceptable substitution |
| Tables | TanStack Table v8 | hand-rolled; `components/shared/DataTable.tsx` is **unused dead code** | ⚠️ |
| Forms | React Hook Form + Zod | hand-rolled validation, **no schema validation library** | ⚠️ **No systematic input validation** |
| State | Zustand + React Query | React Server Components + `router.refresh()` | Legitimate, arguably better |
| Search | MeiliSearch | none | ❌ Missing |
| Testing | Vitest + Playwright | **`playwright` is a devDependency; there are zero test files** | ❌ Missing |
| Error monitoring | Sentry | none | ❌ Missing |
| Analytics | PostHog + GA4 | GA4 **ID field only** — see §8 finding M-3 | ❌ Not wired |

**Verdict on the conflict:** the Supabase-for-Prisma/NextAuth/Pusher swap is a sound engineering decision and should be ratified in an updated spec. The *absent* items (email, payments, rate limiting, tests, monitoring, search) are not substitutions — they are simply not built, and several are called P1 launch blockers by the spec's own priority matrix (§16.2).

---

## 3. Live database state — the evidence that matters most

Queried directly against the production project. **This is the single most damning section of the audit, and also the most objective.**

### 3.1 Row counts

| Populated (11 tables) | Rows | | **Empty — never used (40 tables)** |
|---|---|---|---|
| `role_grants` | 24 | | `leads` **0** |
| `audit_log` | 20 | | `invoices` / `invoice_line_items` / `invoice_payments` **0 / 0 / 0** |
| `page_versions` | 19 | | `messages` / `message_channels` / `channel_participants` **0 / 0 / 0** |
| `pages` | 17 | | `notifications` **0** |
| `service_details` | 9 | | `meetings` / `meeting_participants` **0 / 0** |
| `project_tasks` | 8 | | `deliverables` / `_versions` / `_annotations` **0 / 0 / 0** |
| `project_milestones` | 7 | | `project_files` **0** |
| `permission_modules` | 6 | | `time_entries` **0** |
| `page_templates` | 6 | | `reviews` **0** |
| `pricing_packages` | 5 | | `project_assignments` **0** |
| `content_details` | 5 | | `support_tickets` / `_replies` **0 / 0** |
| `roles` | 4 | | `testimonials` **0** |
| `isolation_policies` | 4 | | `seo_keywords` / `keyword_rankings` **0 / 0** |
| `profiles` / `auth.users` | 3 / 3 | | `api_credentials` **0** |
| `projects` | 2 | | `menu_items` **0** ← menus exist, items do not |
| `menus` | 2 | | `temporary_grants` **0** |
| `organizations` | 1 | | `newsletter_subscribers` **0** |
| `media_assets` | 1 | | `project_services` **0** |

The Supabase **performance advisor reports 55 "unused index" findings** — every index on every one of those empty tables. That is not a performance problem; it is proof that **no row has ever been inserted into those tables in this project's lifetime.** These features have not been partially tested. They have never run.

### 3.2 The three user accounts

| Email | Portal | Role | `organization_id` | Last sign-in |
|---|---|---|---|---|
| gmcfixerpro.to@gmail.com | ADMIN | Global Admin | `d57781b9…` | 31 Jul 2026 |
| shahriaremon964@gmail.com | STAFF | Senior Specialist | `null` | **never** |
| teachperhour@gmail.com | CLIENT | **`null`** | **`null`** | 5 Aug 2026 |

The client account has neither a role nor an organisation. Since every client-side policy resolves through `private.current_org_id()` (which reads `profiles.organization_id`), and `NULL = NULL` evaluates to `NULL` in SQL, **this account can see nothing at all** — not its projects, not its invoices, not its messages. And there is no way to fix it from the UI (see P0-1).

### 3.3 Security advisors — live

Only **two** findings on the entire project, which is genuinely unusual:

| Level | Finding | Detail |
|---|---|---|
| **ERROR** | `security_definer_view` | View `public.public_site_settings` is `SECURITY DEFINER`. **This is deliberate and documented** — migration `0060` sets `security_invoker = false` on purpose, because `site_settings` was simultaneously locked to `authenticated` and this view became the only `anon` read path. The exposed columns (`site_name`, `og_image_url`, `ga4_measurement_id`, `gtm_container_id`, `header_scripts`, `body_start_scripts`) are all things intended to be public. **The advisor is correct that it is a definer view; the design decision is defensible.** The residual risk is that the column list is explicit and must never become `select *` — the migration comment says exactly this. Treat as **P3 / accepted risk**, not a defect. |
| WARN | `auth_leaked_password_protection` | Disabled at the Supabase project level. Partially compensated: `lib/supabase/password-safety.ts` implements a k-anonymity HaveIBeenPwned check in application code for signup and reset. |

### 3.4 Content state

| Content | State |
|---|---|
| Service pages | 9 rows — **5 published**, 3 draft (`ai-machine-learning`, `cybersecurity`, `shopping-ads`), 1 archived (`mobile-apps`) |
| Blog posts | 6 published — but **`blog/shipping-on-the-edge` has no `content_details` row**, so it renders with no excerpt, no category, no date, no author, and sorts last. There is no UI to fix this (see M-5). |
| Case studies | **0 rows.** `/case-studies` and `/case-studies/[slug]` are live routes over an empty table. |
| Standard pages | 2 — `about-us` (draft, unused) and `test-price` (**a published test page live on the public site**) |
| Menus | 2 (`header`, `footer`) — **both with 0 menu items.** The navigation CMS produces nothing; the public header and footer fall back entirely to hardcoded arrays. |
| Pricing packages | 5, all published, seeded by migration `0057` from services |

---

## 4. Complete route inventory (91 routes)

| Group | Count | Notes |
|---|---|---|
| `app/(public)` | 16 | |
| `app/auth` | 5 | |
| `app/admin` | 36 | 4 are pure redirects |
| `app/staff` | 11 | |
| `app/client` | 23 | |

**Route infrastructure present:** `layout.tsx` ×5, `error.tsx` ×6 (incl. `global-error.tsx`), `loading.tsx` ×3, `not-found.tsx` ×1, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`. Dynamic segments: `[id]`, `[slug]`, `[projectId]`, `[...slug]`. Route group `(public)`. **No parallel routes, no intercepting routes, no `template.tsx`, no `default.tsx`** — none needed.

### 4.1 Redirect-only routes (4) — all intentional and correctly documented

| Route | → | Reason (from source comment) |
|---|---|---|
| `/admin/analytics` | `/admin/analytics/seo` | section, not a screen |
| `/admin/logs` | `/admin/audit-logs` | deduplicated two entry points |
| `/admin/content/services` | `/admin/services` | deduplicated two service screens |
| `/admin/content/blog/[id]` | `/admin/content/pages/[id]` | one page editor, not two |

### 4.2 Explicit "not built" routes (4) — the `NotInstrumented` pattern

`/admin/nodes`, `/admin/traffic`, `/client/status`, `/client/messages/drafts` each render a panel that names what is missing, what would be needed to build it, and links to the nearest thing that *does* work. **This is exemplary.** It is the correct opposite of a placeholder. Counted as *deliberately deferred*, not as broken.

### 4.3 Routes over empty tables — will render empty states, not errors

`/case-studies`, `/case-studies/[slug]` (0 rows), `/admin/leads`, `/admin/invoices`, `/admin/reviews`, `/admin/keys`, `/admin/analytics/keywords`, `/staff/notifications`, `/staff/files`, `/staff/time-tracker`, `/client/messages` (+5 sub-routes), `/client/invoices` (+4 sub-routes), `/client/meetings`, `/client/deliverables/[id]`, `/client/support`, `/staff/support`. *(Inferred from code + row counts; not verified in a browser.)*

### 4.4 Route-level authorisation gaps — **P2**

`lib/access-control.ts` `routeModuleMap` contains **11 rules, all under `/admin`**. `grantClearsRoute()` returns `true` for any unmapped path, and `middleware.ts:84` documents this as intentional ("Routes with no rule are unrestricted within their portal").

**Unmapped admin routes, reachable by any ADMIN-portal account regardless of role:**
`/admin` · `/admin/leads` · `/admin/projects` · `/admin/projects/[id]` · `/admin/reviews` · `/admin/notifications` · `/admin/database` · `/admin/analytics/*` · `/admin/docs` · `/admin/support` · `/admin/nodes` · `/admin/traffic` · `/admin/settings` (root)

The database is the real backstop and it holds — a Financial Auditor reaching `/admin/reviews` sees only already-approved reviews, never the pending moderation queue, because `reviews_select_authed` requires `can_edit_content()` or `is_admin()` for anything not approved. But **`/admin/database` exposes `database_health()`, `table_statistics()` and `slow_queries()` to any admin-portal user**, and `slow_queries` is granted to `authenticated` at the function level. Defence in depth is one layer thin here.

Additionally: `routeModuleMap` has **no rules for `/staff/*` or `/client/*` at all**, despite the middleware comment claiming module checks are "applied to all three portals." In practice those portals get portal-separation only.

---

## 5. Data-flow audit — where the chain breaks

The intended chain, and where it actually stops, per subsystem:

```
UI → Server Action → PostgREST → RLS → Postgres → Trigger → Realtime → other clients → UI
```

| Subsystem | Chain status | Breaks at |
|---|---|---|
| Leads / contact form | ✅ **complete end to end** | — |
| Pages / CMS publishing | ✅ complete | — |
| Services catalogue | ✅ complete (admin side) | public `/services` index is disconnected (§7) |
| Invoices (admin) | ✅ complete | no PDF, no payment processor |
| Reviews | ✅ complete | client-side entry point requires a working client account |
| Staff roster & allocation | ✅ complete | — |
| Media library | ✅ complete | — |
| SEO keywords | ✅ complete | no external ranking data source |
| Audit log | ✅ complete (trigger-written, immutable) | — |
| Support tickets | ✅ complete | — |
| **Messaging** | ❌ **breaks at step 1** | **no `createChannel` exists** |
| **Project tasks** | ❌ breaks at create | **no `createTask` / `deleteTask`** |
| **Milestones** | ❌ breaks at create | **no create/update path** |
| **Deliverables** | ❌ breaks at create | **no upload path** |
| **Notifications → UI** | ❌ breaks at the last hop | **bell is fed an empty array in all 31 usages** |
| **Client portal (all of it)** | ❌ **breaks at RLS** | **`profiles.organization_id` is never written** |
| Meetings | ⚠️ partial | create exists; no calendar/availability/email |
| Time tracking | ⚠️ partial | logs persist; no CSV export, no billing link |

---

## 6. CRUD audit — the definitive table

Derived by parsing every `.from("<table>").<op>` call across `lib/`. **This is the strongest single piece of evidence in the audit.**

| Table | Operations reachable from the app | Verdict |
|---|---|---|
| `api_credentials` | select, insert, update, delete | ✅ full |
| `invoices` / `_line_items` / `_payments` | full | ✅ full |
| `media_assets` | full | ✅ full |
| `menus` / `menu_items` | full | ✅ full |
| `organizations` | full | ✅ full |
| `pages` | select, insert, delete | ✅ (updates via `page_versions` + RPC) |
| `page_versions` | select, insert, update | ✅ |
| `pricing_packages` | full | ✅ full |
| `projects` | full | ✅ full |
| `reviews` | full | ✅ full |
| `seo_keywords` | full | ✅ full |
| `staff_profiles` | full | ✅ full |
| `testimonials` | full | ✅ full |
| `service_details` | select, insert, update | ✅ |
| `support_tickets` / `_replies` | select, insert, update | ✅ |
| `time_entries` | select, insert, delete | ✅ |
| `project_files` | select, insert, delete | ✅ |
| `meetings` / `meeting_participants` | select, insert, update | ✅ |
| `messages` | select, insert | ✅ (but unreachable — see below) |
| `deliverable_annotations` | select, insert, update | ✅ |
| `role_grants` / `roles` | select, upsert (+ delete) | ✅ |
| `project_assignments` | select, upsert, delete | ✅ |
| `keyword_rankings` | upsert only | ⚠️ no delete |
| `audit_log` | select only | ✅ correct — trigger-written, immutable by design |
| `leads` | select, update, delete | ✅ correct — created via `submit_lead()` RPC |
| `newsletter_subscribers` | *(no direct path)* | ✅ correct — via `subscribe_newsletter()` RPC |
| `notifications` | select, update, delete | ✅ correct — written by `private.notify()` triggers |
| `profiles` | select, update | ✅ correct — created by `handle_new_user` trigger… **but `organization_id` is never written by anything** ❌ |
| `permission_modules`, `capabilities`, `page_templates`, `isolation_policies`, `security_policies`, `site_settings` | read / update only | ✅ acceptable — seeded catalogues & singletons |
| **`message_channels`** | **select only** | ❌ **no create → messaging cannot start** |
| **`channel_participants`** | **select, update only** | ❌ **no create → nobody can be added to a channel** |
| **`project_tasks`** | **select, update only** | ❌ **no create/delete → Kanban is move-only** |
| **`project_milestones`** | **select only** | ❌ **read-only; the 7 live rows came from `seed/demo_projects.sql`** |
| **`deliverables`** | **select, update only** | ❌ **no upload path** |
| **`deliverable_versions`** | **select only** | ❌ **versions can never be created** |
| **`content_details`** | **select only** | ❌ **blog/case-study metadata is migration-only** |
| **`temporary_grants`** | **none** | ❌ **entire feature is DB-only; no UI, not even in AccessControlConsole** |
| **`project_services`** | **none** | ❌ **service→project traceability never recorded** |
| `capabilities` | none | ❌ 10 seeded rows, zero consumers |

---

## 7. Mock / static / hardcoded data report

The codebase has been through at least one deliberate de-mocking pass — many source comments describe removing fabricated figures ("$12,400 overdue", "99% Uptime SLA", "12M+ Daily API requests", a "$24,500 Stripe payment for a contract that does not exist"). What remains:

### M-1 — `components/admin/RevenueChart.tsx` — **P1, the worst remaining mock**

Lines 9–32. A fully hardcoded revenue dataset rendered on **`/admin` — the first screen an administrator sees**:

```ts
Monthly: [Jan 84k, Feb 92k, Mar 88k, Apr 118k, May 142k, Jun 104k]
Daily:   [Mon 4.2k, Tue 5.8k, … Sat 2.3k]
```

The `invoices`, `invoice_line_items` and `invoice_payments` tables all contain **zero rows.** The dashboard therefore presents ~$628k of invented revenue for a business with no invoices. The rest of the same page (`summary`, `health`, `CommandLogs`) is correctly wired to real queries, which makes this chart *more* dangerous, not less — everything around it is trustworthy.
→ **Should read `invoice_totals` grouped by month.**

### M-2 — `app/(public)/blog/NewsletterPanel.tsx:24` — **P2**
```ts
// TODO: POST to a real list. Nothing leaves the browser today.
setState(/regex/.test(email) ? "done" : "invalid");
```
Shows a success confirmation and discards the address. **A working implementation already exists** — `subscribe_newsletter()` RPC + `lib/supabase/newsletter-actions.ts` + `newsletter_subscribers` table — and the *footer* uses it. Only this panel was missed. Same page also claims **"Join 12,000+ tech leaders"** against 0 subscribers.

### M-3 — GA4 / custom scripts configured but never emitted — **P2**
`site_settings.ga4_measurement_id`, `header_scripts` and `body_start_scripts` are validated and persisted by `site-settings-actions.ts`. Grep confirms **no consumer anywhere** — `app/layout.tsx` contains no `<Script>`, no `gtag`, no script injection. An administrator can configure analytics, see it save, and nothing is ever tracked. This is UI-only in the most misleading sense: it *looks* like it worked.

### M-4 — `lib/agency.ts` — **P3** (`agencyPulse`, rendered by `AgencyPulse` on `/about`)
`24 Active Global Builds` (marked `live: true`, with a pulsing "live" indicator), `1,420 Commits This Month`, `4.9/5 Average CSAT`. All literals. The CSAT figure is contradicted by `reviews` = 0 rows. The file's own comment admits it: *"`agencyPulse` is presented as live telemetry."*

### M-5 — `lib/team.ts` — **P3**
Four fictional leadership profiles (Alex Vance, Elara Kent, Marcus Thorne, Sarah Chen) with skills and roles. `/about` **does** also query `listPublicStaff()`, so this appears to be a fallback — but the live `staff_profiles` table has 1 row. Every `portrait` is a `lh3.googleusercontent.com/aida-public/…` design-tool CDN URL that **will expire**; the file's own TODO says so. Same expiring-CDN pattern appears in `app/(public)/page.tsx:157`, `app/(public)/services/page.tsx:118,233`, `app/(public)/contact/page.tsx:135`.

### M-6 — Hardcoded marketing content on public pages — **P2 (a requirements gap, not a lie)**
| File | Static content | Should come from |
|---|---|---|
| `app/(public)/services/page.tsx` | `brandIdentityFacets`, `webCapabilities`, `growthDisciplines`, `engagementIncludes` | `pages` + `service_details` (9 rows exist!) |
| `app/(public)/page.tsx` | `capabilities` (3 cards), `stack` (4 logos) | `service_details` |
| `app/(public)/pricing/page.tsx` | `comparison` table (SLAs, IP ownership, response times) | should be data, and it makes **contractual claims** ("< 4 hours SLA-guaranteed", "Full transfer on payment") |
| `components/layout/PublicHeader.tsx` | `links`, `serviceColumns` | partly by design (documented fallback) — acceptable |
| `components/layout/PublicFooter.tsx` | `socials` (TODO: real URLs) | site_settings |
| `app/(public)/contact/page.tsx` | `channels`, `socials` | site_settings |
| `lib/legal.ts` | full text of privacy/terms | CMS `pages` |

### M-7 — Dead / unwired UI controls — **P2**
| Location | Control | Status |
|---|---|---|
| `app/admin/page.tsx:38` | **"Run System Audit"** button | no handler. Dead CTA on the primary admin screen. |
| `app/auth/login/LoginForm.tsx:197` | **"Continue with Google"** (under "Or enterprise SSO") | `type="button"`, no handler. **`signInWithOAuth` appears nowhere in the repository.** Dead auth affordance. |
| `components/client/MessageBlocks.tsx:143` | file **Download** button | `// TODO: point at the stored asset once the files API lands.` |
| `app/client/meetings/page.tsx:296` | **Recording** playback button | `// TODO: link to the stored recording once media hosting exists.` |
| `app/client/invoices/[id]/PaymentPanel.tsx:143` | payment processor | `// TODO: replace with the real processor session once billing is wired.` |
| `app/client/meetings/page.tsx:74` | scheduler open | `// TODO: open the scheduler once the meetings API exists.` |

### M-8 — Dead code — **P4**
- `components/shared/DataTable.tsx` (9.7 KB) — **rendered nowhere.**
- `components/cms/MediaPicker.tsx` (10 KB) — **rendered nowhere**, despite `MediaLibrary` and `PageEditor` both existing.
- `scripts/sync-types.mjs` — **0 bytes.**
- `git_diff.txt` (67 KB) and `git_status.txt` — build artefacts committed into the repo root; both stale.
- `diagram.svg` / `diagram (1).svg` — 87 KB of unreferenced assets in the repo root.
- `@upstash/ratelimit`, `@upstash/redis` — installed, imported nowhere.

**What is *not* mock, and deserves credit:** `getMarketingStats()` counts real rows and **omits** a stat rather than showing zero. `getNavBadges()` returns `undefined` instead of `0` so badges disappear. `CommandLogs` reads the real audit trail. `getPortalKpis()` derives every figure and hides the milestone card when no dated milestone exists. `DashboardHeader` defaults notifications to `[]` with a comment explaining that inventing them was worse. That is disciplined work.

---

## 8. Realtime audit

### 8.1 The hook is correct — this is a genuine strength

`lib/supabase/use-realtime.ts` does the one thing almost every Supabase codebase gets wrong: it calls `supabase.realtime.setAuth(token)` **before** `subscribe()`. Without that ordering a channel reports `SUBSCRIBED`, delivers nothing, and raises no error. The file's comment states five subscriptions in this codebase previously had exactly that bug. Cleanup via `removeChannel` is correct; the callback is held in a ref; the table spec is serialised so inline arrays don't re-subscribe. **No component bypasses the hook** — zero raw `.channel()` calls outside it.

### 8.2 Live realtime publication — 35 tables

Verified by live query on `pg_publication_tables`. 21 subscriptions exist in the app.

| ✅ Published **and** subscribed (14) | ⚠️ Published, **no subscriber** (18) | ❌ **Not published**, arguably should be |
|---|---|---|
| `projects`, `project_tasks`, `invoices`, `leads`, `reviews`, `media_assets`, `pages`, `profiles`, `staff_profiles`, `organizations`, `seo_keywords`, `service_details`, `notifications`, `messages`, `project_files`, `api_credentials`, `audit_log`, `deliverables` | `content_details`, `meetings`, `meeting_participants`, `message_channels`, `channel_participants`, `pricing_packages`, `project_assignments`, `support_tickets`, `support_ticket_replies`, `temporary_grants`, `testimonials`, `time_entries`, `deliverable_versions`, `deliverable_annotations`, `invoice_payments`, `role_grants`, `keyword_rankings` | **`project_milestones`** ← client Milestone Roadmap & "Next Milestone" KPI never live-update; `invoice_line_items`; `menus` / `menu_items`; `page_versions`; `site_settings` |

### 8.3 Cross-portal synchronisation matrix

| Path | Status | Evidence |
|---|---|---|
| Admin ↔ Admin | ✅ works | 13 admin tables subscribed |
| Public site ↔ CMS | ⚠️ **not realtime — by design.** Public pages are RSC + `revalidatePath` | acceptable; publishing propagates on next request |
| Admin → Staff (tasks) | ✅ works | `project_tasks` subscribed in `BoardClient` |
| Admin → Client (invoices) | ✅ code correct | `client/invoices/InvoicesTable` subscribes — **but blocked by P0-1** |
| Client ↔ Staff (messages) | ✅ code correct | `MessagesHub` shared by both portals, subscribes to `messages` — **but blocked: no channel can exist** |
| Notifications → any user | ❌ **broken at the UI** | Triggers write rows (`0052`); `notifications` is published; **but the bell renders `[]` everywhere** |
| Meetings ↔ participants | ❌ **no subscription** | `meetings` and `meeting_participants` are published; nothing listens. `MeetingScheduler` uses `router.refresh()` only. |
| Projects → Client milestones | ❌ **not published + not subscribed** | client sees stale milestones until manual refresh |
| Support tickets ↔ agent | ❌ **no subscription** | `TicketWorkspace` shared by staff and client; published but no listener |
| Time entries → admin | ❌ no subscription | |

### 8.4 Realtime findings

- **R-1 (P2):** The **NotificationBell is inert application-wide.** `DashboardHeader` (used by 31 routes) defaults `notifications` to a module-level empty array, and **no caller ever passes the prop.** `AdminCommandBar:183` renders `<NotificationBell />` with no props at all. Meanwhile `notification-actions.ts` (list, unread count, mark read, mark all, delete) is fully written, four DB triggers populate the table, and the table is in the realtime publication. **The entire notification system is built and disconnected at the final component boundary.**
- **R-2 (P2):** 18 tables carry realtime replication overhead with no consumer. Either subscribe or remove from the publication.
- **R-3 (P2):** `project_milestones` is the one table clients would most want live and it is not published.
- **R-4 (P3):** Every subscription handler is `() => router.refresh()`. Correct and safe (no optimistic-state divergence), but it means a single INSERT anywhere in a table triggers a full RSC re-render for every viewer of that table — no filters are used on the broad subscriptions (`admin:pages`, `admin:reviews`, `admin:media`, `staff:board`, `client:messages`). At scale this is a thundering-herd risk.
- **R-5 (P3):** `client:messages` subscribes to the whole `messages` table with no `filter`, so a client's browser is woken by every message in every channel it can see. Should be `channel_id=eq.<id>`.

---

## 9. Database audit — detail

### Strengths (state these plainly — they are real)
- **RLS enabled on 51/51 tables**, all with explicit policies. Live-verified.
- `FOR ALL` policies were deliberately split into per-operation policies (`0032`), and permissive policies consolidated (`0003`) — both real performance and clarity wins.
- `auth.uid()` wrapped in `(select …)` throughout (`0054`) — the documented Supabase performance idiom.
- **Money is never stored.** `invoice_totals` and `client_revenue` are views computed from line items and payments. `projects.progress` derived from milestones. This eliminates an entire class of drift bug.
- **Audit log immutability enforced by trigger** (`private.reject_audit_mutation`, `reject_audit_insert`, `reject_audit_truncate`), not merely by the absence of an UPDATE policy. `0048` closed an audit-forgery hole.
- `private.reference_counters` is deny-all by policy and reachable only through `SECURITY DEFINER` issuers, so a retired project reference can never be reissued (`0038`).
- `SECURITY DEFINER` dropped from all API-exposed functions (`0030`, `0031`); `search_path = ''` set on every definer function.
- Migration self-registration (`schema_migrations`, 61 rows) matching 61 files on disk — **no drift between repo and database.**
- Covering FK indexes added deliberately (`0033`, `0047`).
- Table and column comments are unusually good and explain *why*, not what.

### D-1 — `public.public_site_settings` is `SECURITY DEFINER` — **P3, accepted risk (live ERROR advisor)**
`0060` sets `security_invoker = false` deliberately, with a comment explaining why: it is the only `anon` read path after `site_settings` was restricted to `authenticated`. The exposed column list is explicit and all of it is intended to be public. **This is a considered decision, not an oversight** — I flagged it as P1 on first pass and was wrong. The live advisor will keep reporting it; suppress or document it. The real hazard is adjacent: `header_scripts` / `body_start_scripts` are readable by `anon` through this view, which is harmless only because nothing renders them (see S-7).

### D-2 — Staff role tiers are **not enforced at the database level** — **P1**
`0008_projects.sql:188`:
```sql
create policy projects_select on public.projects for select to authenticated using (
  private.is_admin()
  or organization_id = private.current_org_id()
  or lead_id = (select auth.uid())
  or private.current_portal() = 'STAFF'      -- ← any staff member sees every project
);
```
`private.can_see_project()` has the same clause, and it gates `project_files`, `deliverables`, `meetings`, `time_entries` and messaging. Spec §9.3 requires *"Specialist Staff: access only their assigned projects"* and *"Contractor: only their task list, no client billing info."* **Neither is enforced.** `project_assignments` exists (and is the right mechanism) but is not referenced by any policy — and has 0 rows.

### D-3 — No role row for clients — **P2**
`roles` has 4 rows, none for CLIENT. The live client profile has `role_id = NULL`, so `effective_level()` resolves `none` on every module. This happens to be safe, but it means client authorisation is entirely portal-based and outside the permission matrix the rest of the system uses.

### D-4 — `capabilities`, `temporary_grants`, `isolation_policies`, `project_services` are schema without consumers — **P3**
`capabilities` (10 rows) has zero references in application code. `temporary_grants` has a full expiry-on-read implementation in `private.effective_level()` and **no UI whatsoever**, not even in `AccessControlConsole.tsx` (36 KB) — grep for "temporary" in that directory returns nothing. `project_services` has no code path at all.

### D-5 — Public RPC grants to `anon` — **P3 (review, likely fine)**
`reorder_menu_items`, `reorder_services` and `next_available_slug` are `EXECUTE`-granted to `anon`. All three are `SECURITY INVOKER`, so RLS still applies and an anonymous caller cannot actually reorder anything. But granting `anon` on mutation-shaped functions invites a future mistake. `slow_queries()` / `database_health()` / `table_statistics()` are granted to `authenticated` broadly — any signed-in user of any portal can call them directly via PostgREST, bypassing the `/admin/database` route entirely. **That one is worth tightening (P2).**

### D-6 — No soft-delete / archive on most entities — **P3**
`deleteOrganization`, `deleteProject`, `deleteInvoice`, `deleteLead`, `deleteReview`, `deleteCredential` are all hard deletes. Spec §11.2 requires *"Archived cards stored and searchable"*; `projects.status` has `Archived` but tasks and leads do not. No restore path exists for anything.

### D-7 — `seed/demo_projects.sql` is the only source of the live milestone and task rows — **P3**
The 7 milestones and 8 tasks in production came from a demo seed file, not from the application. They are, by definition, demo data sitting in a production database.

---

## 10. Security audit

| # | Finding | Severity |
|---|---|---|
| S-1 | **No rate limiting anywhere.** Spec §15.1 requires 5 req/15 min on auth endpoints. `@upstash/ratelimit` is installed and never imported. `submit_lead()` and `subscribe_newsletter()` are `anon`-executable RPCs with no throttle → open to spam and enumeration-by-volume. | **P1** |
| S-2 | **No 2FA enrolment.** `verifyTotp()` correctly challenges an existing factor and `/auth/verify-2fa` exists, but `mfa.enroll` appears **nowhere**. No user can turn 2FA on. Spec §15.1: *"2FA available to all users."* `access-control.ts` even models `totpEnrolled` counts and a `TotpEnforcement` type for a feature nobody can activate. | **P1** |
| S-3 | `public_site_settings` view is `SECURITY DEFINER` — **deliberate** (`0060`), documented, exposes only public columns. Advisor ERROR is a known accepted risk. | **P3 — accepted** |
| S-4 | **No schema validation library.** No Zod, no RHF. Every server action hand-parses `FormData` with `String(form.get(...))`. Validation is inconsistent: some actions check length and regex, others coerce and insert. RLS and DB constraints are the real guard. Spec §14.1 mandates Zod. | **P2** |
| S-5 | Route→module map covers 11 of 36 admin routes; nothing for staff/client (see §4.4). | **P2** |
| S-6 | `slow_queries()`, `database_health()`, `table_statistics()` granted to `authenticated` — any signed-in client can call them via PostgREST. | **P2** |
| S-7 | Admin can paste arbitrary `header_scripts` / `body_start_scripts` into `site_settings`. Currently harmless because nothing renders them (M-3) — but **the moment M-3 is fixed this becomes stored XSS with full session access on every public page.** The UI already warns about it. Fix M-3 and S-7 together or not at all. | **P2 (latent P0)** |
| S-8 | **No CSRF tokens.** Next.js Server Actions provide built-in origin checking, which is adequate, but the spec explicitly requires CSRF tokens. Document the deviation. | **P3** |
| S-9 | **File upload validation is thin.** `uploadProjectFile` / `uploadMedia` — no virus scanning (spec §15.1 requires it), and MIME-type checking should be re-verified server-side. Storage has 2 buckets, 3 objects. | **P3** |
| S-10 | Leaked-password protection disabled at project level; compensated in app code for signup/reset only — **not for admin-set passwords.** | **P3** |
| S-11 | `.env.local` is present in the repo working tree. `.gitignore` was modified (per `git_status.txt`) — verify it is excluded and that the anon key has never been committed. **Recommend rotating the anon key as a precaution.** | **P2 — verify** |
| S-12 | No IDOR found. Every `[id]` route resolves through an RLS-protected query. `safeNext()` correctly blocks open redirects. Privilege escalation is blocked by `guard_profile_privileges` / `reject_self_elevation` triggers. `signUp` explicitly refuses to trust client-supplied portal/role. **Credit where due — these are the things most often got wrong, and they are right here.** | ✅ |

---

## 11. Portal reports

### 11.1 Admin portal — 36 routes — **~72% complete, the strongest portal**

| Module | UI | Backend | DB | Realtime | Verdict |
|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ⚠️ **contains the fabricated RevenueChart** + dead "Run System Audit" |
| Leads / CRM | ✅ | ✅ | ✅ | ✅ | ✅ **fully implemented** |
| Clients | ✅ | ✅ | ✅ | ✅ | ⚠️ cannot link a client *user* to an org (P0-1) |
| Projects | ✅ | ✅ | ✅ | ✅ | ⚠️ no task/milestone creation |
| Staff roster + allocation | ✅ | ✅ | ✅ | ✅ | ✅ fully implemented |
| Services catalogue | ✅ | ✅ | ✅ | ✅ | ✅ fully implemented |
| Content / Page builder | ✅ | ✅ | ✅ | ✅ | ✅ strong — draft/publish/version/restore all real |
| Navigation | ✅ | ✅ | ✅ | — | ⚠️ works but **0 menu items exist**; header/footer ignore it |
| Media | ✅ | ✅ | ✅ | ✅ | ✅ fully implemented |
| Invoices | ✅ | ✅ | ✅ | ✅ | ⚠️ **no PDF generation, no Stripe, no recurring, no reminders, no tax config, no expense tracking** (spec §10.6 — 6 of 8 features absent) |
| Reviews moderation | ✅ | ✅ | ✅ | ✅ | ✅ incl. bulk approve |
| SEO / keywords | ✅ | ✅ | ✅ | ✅ | ⚠️ no external data source; positions must be typed in manually |
| Access control | ✅ | ✅ | ✅ | ✅ | ⚠️ **no temporary-grant UI** despite full DB support |
| Audit logs | ✅ | ✅ | ✅ | ✅ | ✅ fully implemented |
| API keys | ✅ | ✅ | ✅ | ✅ | ✅ registry-only by design (correct) |
| Database health | ✅ | ✅ | ✅ | — | ✅ real RPCs |
| Settings / SEO tags | ✅ | ✅ | ✅ | — | ❌ **GA4 + scripts saved and never emitted (M-3)** |
| Notifications | ✅ | ✅ | ✅ | — | ⚠️ "attention items" screen only; not the notification feed |
| Analytics | ⚠️ | ⚠️ | ⚠️ | — | ❌ **spec §12 requires 8 charts + GA4 + campaign reporting. Delivered: SEO overview + keyword table.** |
| Meetings | ❌ | — | ✅ | — | ❌ **there is no `/admin/meetings` route at all.** Spec §7.2 requires calendar, reassignment, notes, status, reschedule, convert-to-project, analytics. |
| Nodes / Traffic | — | — | — | — | ✅ honestly marked not-instrumented |

**Missing admin routes the spec requires:** `/admin/meetings` (§10.2 nav group), project templates (§11.4), email template editor & broadcast (§10.2 Notifications), expense tracking & tax config (§10.6), client CSV/Excel export, bulk client email, merge duplicate clients (§10.4).

### 11.2 Staff portal — 11 routes — **~48% complete**

| Module | Verdict |
|---|---|
| Dashboard (`getStaffWorkspace`) | ✅ real |
| My Projects | ✅ real — **but sees *all* projects, not assigned ones (D-2)** |
| Task board | ⚠️ **move-only.** No create, no delete, no due dates, no checklists, no attachments, no comments, no card activity log, no filters, no templates, no archive. Spec §11.2 lists 9 features; **1 is implemented.** |
| Messages | ✅ code complete — ❌ **unusable: no channel can be created** |
| Meetings | ⚠️ create works; no calendar view, no notes, no post-meeting summary, no reassignment |
| Files | ✅ upload/list/delete real — ⚠️ **no versioning, no "ready for client delivery" flag** (spec §9.2) |
| Time tracker | ✅ persists — ❌ no CSV export, no billing link, no per-task timer |
| Performance | ✅ real queries — ⚠️ no client-satisfaction score (needs reviews), no monthly trend |
| Notifications | ✅ **the one place notifications actually render** (`NotificationsList` + realtime) |
| Support | ✅ real |
| Settings | ✅ real |

**Missing:** no staff-side client-communication escalation to admin, no deliverable approval workflow (spec §9.3 Team Lead), no department-scoped visibility.

### 11.3 Client portal — 23 routes — **~22% complete. Blocked at the root.**

Every route is built. Almost every route queries real tables. **And none of it can work,** because `profiles.organization_id` has no write path and every client policy is org-scoped.

| Module | Code | Reachable? |
|---|---|---|
| Overview / KPIs | ✅ real queries | ❌ returns empty for every client |
| Projects + `[id]` | ✅ real | ❌ |
| Read-only Kanban | ✅ real | ❌ |
| Milestones / Timeline | ✅ real | ❌ + not realtime |
| Deliverables + annotations | ✅ real, well built | ❌ **and nothing can create a deliverable** |
| Messages (6 routes) | ✅ real | ❌ **and no channel can exist** |
| Invoices (5 routes) | ✅ real | ❌ **payment is a stub** |
| Meetings | ✅ real | ❌ no booking UI, no rescheduling |
| Reports | ⚠️ derived from projects + billing | ❌ **no PDF, no campaign charts** (spec §8.2, §12.4) |
| Submit review | ✅ real | ❌ |
| Support | ✅ real | ❌ |
| Settings | ✅ real (profile only) | ⚠️ **no 2FA toggle, no notification preferences** |
| Entities / Help | ✅ real | ❌ |
| Status / Drafts | — | ✅ honestly not-instrumented |
| **Notifications** | — | ❌ **no client notifications route exists at all**, and the bell is empty |
| **Onboarding** (§8.3) | — | ❌ no welcome email, no guided tour, no brand-asset upload prompt |

### 11.4 Public website — 16 routes — **~65%**

| Page | Verdict |
|---|---|
| `/` | ⚠️ **CMS homepage override works well.** But only 4 sections render (Hero, 3 static capability cards, real metrics, CTA). **Spec §5.1 lists 10 sections; 6 are missing** — Services Overview grid from CMS, About Snapshot, How It Works, Featured Case Studies, Testimonials/Reviews, Pricing Packages, Blog/Insights, inline booking calendar. |
| `/services` | ❌ **The most significant public-site defect.** Fully hardcoded marketing page. Zero data imports. Its only links are `/book-meeting`, `/case-studies`, `/contact` — **it does not link to a single one of the 5 published service pages.** They are reachable only via the header dropdown. Spec §5/§6 require a dynamic, filterable catalogue. |
| `/services/[slug]` | ✅ fully CMS-driven, with `BlockRenderer`, ROI forecaster, sticky CTA |
| `/pricing` | ✅ packages from DB — ⚠️ hardcoded comparison table making SLA/IP contractual claims |
| `/blog`, `/blog/[slug]` | ✅ CMS-driven — ⚠️ one post has no `content_details` and cannot be fixed from the admin |
| `/case-studies`, `/[slug]` | ⚠️ correctly wired, **0 rows** — permanently empty |
| `/about` | ⚠️ real staff query **+ 4 fictional leadership profiles + fake "live" telemetry** |
| `/contact` | ✅ **form works end to end** → `submit_lead()` → `leads` → notification |
| `/book-meeting` | ⚠️ **honest and correct** — records a lead because anon cannot create meetings. But spec §7.1 requires a calendar, availability grid, meeting types, confirmation email, Meet/Zoom link and reminders: **7 of 7 absent.** |
| `/reviews` | ✅ wired — 0 rows. **No aggregate score widget, no JSON-LD** (spec §13.2) |
| `/privacy`, `/terms`, `/legal/[slug]` | ⚠️ from `lib/legal.ts`, not CMS |
| `/[...slug]` | ✅ CMS catch-all |

**Trust & conversion elements (spec §5.2): 0 of 7 implemented** — no live visitor counter, no hero review aggregate, no client logo marquee, no press badges, no WhatsApp button, no chatbot, no exit-intent. *(Several of these are arguably good to omit — a fake visitor counter would be worse than none.)*

**SEO (spec §15.3):** `metadataBase`, OG images, canonicals, dynamic sitemap and robots are all correctly implemented — genuinely good. But **JSON-LD / structured data appears nowhere in the codebase**, which the spec requires on homepage, services, blog, reviews and about.

---

## 12. Workflow matrix — Service → Lead → CRM → Project → Invoice → Payment

```
Visitor
  │ ✅ /services (hardcoded page — does NOT list DB services) ─┐
  │ ✅ header dropdown → /services/[slug] (CMS)  ←─────────────┘
  ▼
Service page ✅  →  Pricing package ✅ (5 rows, from DB)
  ▼
"Get Started" CTA ✅  →  /contact or /book-meeting
  ▼
Contact form ✅  →  submitLead()  →  submit_lead() RPC (anon-safe)
  ▼
public.leads ✅  (reference assigned by private.assign_lead_reference)
  ▼
Notification ⚠️  row is written by trigger → BUT the bell renders nothing (R-1)
  ▼
CRM /admin/leads ✅  status pipeline, assignee, realtime — fully working
  ▼
────────────────────── ✂️  THE CHAIN BREAKS HERE  ──────────────────────
  ▼
Convert lead → Client   ❌  NO ACTION EXISTS. An admin must re-key the
                            organisation by hand. `projects.lead_id` and
                            `leads.organization_id` columns exist and nothing
                            populates them from a conversion.
  ▼
Create client login     ❌  NO PATH. Nothing writes profiles.organization_id.
  ▼
Staff assignment        ⚠️  saveAssignment() exists (0 rows) — but it does not
                            gate visibility (D-2), so it is bookkeeping only
  ▼
Proposal                ❌  NO CONCEPT ANYWHERE. Not in schema, not in code.
  ▼
Meeting                 ⚠️  createMeeting() works; no calendar, no email
  ▼
Project                 ✅  createProject() works — but no task/milestone
                            creation, so a new project is an empty shell
  ▼
Invoice                 ✅  createInvoice + line items + payments all real
  ▼
Payment                 ❌  PaymentPanel is a stub. No processor. No bKash/Nagad.
  ▼
Review request          ❌  spec §13.1 requires auto-email on completion. No email.
```

**Transitions that succeed: 8. Transitions that fail: 6. The pipeline cannot complete a single customer journey end to end.**

---

## 13. UI / UX audit

**Strengths:** consistent design system with semantic tokens; `EmptyState` / `PortalStates` / `NotInstrumented` used everywhere rather than blank screens; `error.tsx` at 6 levels; `loading.tsx` on all three portals; ARIA labels and `aria-live` regions present; source comments show real accessibility reasoning (contrast pairs chosen as `-subtle`/`-subtle-fg` because tint-on-tint lands at 3.4–4.4:1; font `display: optional` chosen after measuring 0.140 CLS). This is above-average front-end craft.

| # | Issue | Severity |
|---|---|---|
| U-1 | Dead CTAs: "Run System Audit", "Continue with Google", file Download, meeting Recording (§M-7) | **P2** |
| U-2 | Fabricated revenue chart on the primary admin screen (§M-1) | **P1** |
| U-3 | `/services` does not link to any service — a user browsing the main Services page cannot reach a service page from it | **P1** |
| U-4 | Notification bell present on 31 screens and permanently empty | **P2** |
| U-5 | Client portal has no notifications screen; staff does. Inconsistent IA. | **P3** |
| U-6 | Terminology drift: "Command Center" / "Executive Dashboard" / "Nexus_OS" / "Nodes" / "Traffic Control" (sci-fi ops language) vs the spec's "Admin Dashboard", "Clients", "Projects". Two different products in one UI. | **P3** |
| U-7 | `test-price` is a **published page live on the public site** | **P2** |
| U-8 | Expiring `lh3.googleusercontent.com` CDN images in 5 files — these will 404 without warning | **P2** |
| U-9 | Pricing page makes contractual SLA/IP claims in hardcoded JSX | **P2** |
| U-10 | No skip-link, no visible focus-trap audit, no keyboard testing evidence. WCAG 2.1 AA (spec §15.3) is **unverified**, not proven absent. | **P3** |
| U-11 | Spec §3 mandates a dark-green palette (`#0D1F17`, `#00FF87`, Space Grotesk). Implementation uses Space Grotesk ✅ and a brand/ion/orchid token system — **the exact hex palette was not followed.** Verify this is an accepted change. | **P3 — confirm intent** |

---

## 14. Performance audit

Genuinely hard to assess: there is no data, no instrumentation, no test suite, and I did not run the app.

| Observation | Note |
|---|---|
| **No N+1 patterns found** | Queries use `.in(...)` batching and `Promise.all`; `content-queries.ts` deliberately does 2 queries instead of a broken embed |
| `unstable_noStore()` used deliberately | Correct for per-user portal data |
| Some sequential awaits | e.g. `staff/messages/page.tsx` awaits `listChannels()` then `listMessages()` — unavoidable (dependency), but several other pages could parallelise |
| Server/client boundary | Clean. `"use client"` only where interactivity requires it. Business logic is server-side. |
| Bundle | `motion` (Framer) is heavy and imported into public marketing components (`CursorTrail`, `Reveal`, `Spotlight`, `HeroParallax`, `NoiseParallax`) — likely the largest cost on LCP |
| ISR / revalidation | Not used. Public pages are dynamic per request (`noStore` transitively) — **spec §15.2 targets LCP < 2.5s and Lighthouse > 90; dynamic rendering on every public page works against that.** |
| Images | `next/image` used, `remotePatterns: hostname: '**'` — **wildcard remote image host is a mild abuse vector** (P3) |
| `tsconfig` includes `.next-build/types` | Fine, but `tsconfig.tsbuildinfo` (235 KB) is committed |
| Realtime | 18 published tables with no subscriber = wasted WAL replication; unfiltered subscriptions = unnecessary re-renders (R-4/R-5) |

**Cannot be verified without a running instance:** Lighthouse, FCP/LCP/TBT/CLS, API P95, query time. Recommend adding Lighthouse CI (spec §15.2 already names it) before making any performance claim.

---

## 15. Requirements vs implementation matrix

Status key: **FULL** · **PARTIAL** · **UI ONLY** · **BACKEND ONLY** · **MOCK** · **BROKEN** · **MISSING** · **CONFLICT**

| # | Spec requirement | Expected | Actual | Evidence | Status | Priority |
|---|---|---|---|---|---|---|
| §4.2 | Role-based routing, 3 portals | middleware gate | portal separation ✅, module gate on 11/36 admin routes | `middleware.ts`, `access-control.ts:117` | **PARTIAL** | P2 |
| §5.1 | Homepage, 10 sections | dynamic from CMS | 4 sections, 3 static | `app/(public)/page.tsx` | **PARTIAL** | P2 |
| §5.1 | Testimonials pulled live from reviews DB | on homepage | not on homepage; `/reviews` only; 0 rows | — | **MISSING** | P2 |
| §5.2 | 7 trust/conversion elements | live counter, chatbot, WhatsApp… | 0 of 7 | — | **MISSING** | P3 |
| §6 | Every service is a DB record, admin CRUD | dynamic catalogue | ✅ admin side fully working | `service-actions.ts` | **FULL** | — |
| §6 | `/services` lists services dynamically | filterable grid | **hardcoded page, links to no service** | `app/(public)/services/page.tsx` | **MOCK** | **P1** |
| §6.2 | Drag-reorder, bulk toggle, duplicate, tags | admin editor | reorder ✅ (`reorder_services` RPC); no bulk, no duplicate, no tags | — | **PARTIAL** | P3 |
| §7.1 | Booking: types, availability grid, slots, confirm email, Meet link, reminders | 7 features | **0 of 7.** Form records a lead. | `BookMeetingForm.tsx` | **MISSING** | **P1** |
| §7.2 | Admin meeting management (7 features) | calendar, reassign, notes, convert-to-project… | **no `/admin/meetings` route exists** | route inventory | **MISSING** | **P1** |
| §8.2 | Client portal, 11 modules | full self-service | all 11 built, **none reachable** | P0-1 | **BROKEN** | **P0** |
| §8.3 | Client onboarding (5 steps) | welcome email, tour, brand upload | 0 of 5 | — | **MISSING** | P1 |
| §9.2 | Staff workspace, 10 modules | — | 7 partial, 3 solid | §11.2 | **PARTIAL** | P2 |
| §9.3 | 3 staff tiers with scoped access | DB-enforced | **`current_portal()='STAFF'` sees everything** | `0008:188` | **BROKEN** | **P1** |
| §10.2 | Admin nav, 12 groups | — | 11 present; Meetings absent | — | **PARTIAL** | P1 |
| §10.3 | 8 live KPI cards | derived | 4 real + 1 fabricated chart | `admin/page.tsx` | **PARTIAL** | P1 |
| §10.4 | Client mgmt: health, bulk email, CSV, merge | 6 features | health ✅; other 5 absent | `client-actions.ts` | **PARTIAL** | P3 |
| §10.5 | Staff mgmt: heatmap, assign, performance, invites | 6 features | 4 ✅; no email invite, no payroll report | `staff-actions.ts` | **PARTIAL** | P2 |
| §10.6 | Invoicing: PDF, recurring, Stripe, bKash, reminders, P&L, expenses, tax | 8 features | **2 of 8** (creation, payment recording) | `invoice-actions.ts` | **PARTIAL** | **P1** |
| §11.2 | Kanban: 9 features | create/DnD/checklist/attach/comment/filter/template/archive | **1 of 9** (move) | `task-actions.ts` | **BROKEN** | **P1** |
| §11.3 | Milestones + Gantt + auto-notify + critical path | 4 features | read-only display; **no create/edit**; no Gantt; no critical path | `project-queries.ts` | **PARTIAL** | **P1** |
| §11.4 | Project templates | pre-populate board | **absent** | — | **MISSING** | P2 |
| §12.1 | 8 admin analytics charts | Recharts | **0 of 8** | — | **MISSING** | P2 |
| §12.3 | GA4 integration, 8 metrics | gtag + API | **ID field saved, never emitted** | M-3 | **UI ONLY** | P2 |
| §12.4 | Per-client campaign reports + PDF | SEO/PPC/Social/Email | **none**; `/client/reports` shows project+billing only | — | **MISSING** | P2 |
| §12.5 | Hotjar, GSC, Pixel, GTM | 5 tools | **0 of 5** | — | **MISSING** | P3 |
| §13.1 | Review flow: auto-email → form → queue → publish | 7 steps | queue ✅, form ✅, publish ✅; **no auto-email** | `review-actions.ts` | **PARTIAL** | P2 |
| §13.2 | Public display: carousel, per-service, aggregate widget, JSON-LD | 5 features | `/reviews` list only | — | **PARTIAL** | P2 |
| §14.1 | Prisma/NextAuth/Pusher/Redis/Resend/Stripe/… | 21 technologies | Supabase substitutes 3; **7 absent** | package.json | **CONFLICT** | P1 |
| §15.1 | RBAC, JWT rotation, 2FA, rate limit, CSRF, sanitisation, XSS, virus scan, env, audit log | 10 controls | RBAC ✅ audit ✅ env ✅ JWT ✅; **2FA enrol ❌ rate limit ❌ virus scan ❌**; CSRF/validation partial | §10 | **PARTIAL** | **P1** |
| §15.2 | 8 performance targets | Lighthouse CI etc. | **nothing measured** | — | **MISSING** | P3 |
| §15.3 | Unique meta ✅, JSON-LD ❌, sitemap ✅, robots ✅, WCAG ?, alt text ✅ | 6 items | 4 ✅, 1 ❌, 1 unverified | — | **PARTIAL** | P2 |
| §16 | Phases 1–6 | 18 weeks | **P1 ≈ 70%, P2 ≈ 30%, P3 ≈ 40%, P4–5 0%** | — | **PARTIAL** | — |

---

## 16. Prioritised findings

### P0 — BLOCKER (cannot operate in production)

**P0-1 · The Client Portal is structurally unreachable.**
Nothing in the codebase writes `profiles.organization_id`. Verified by exhaustive grep across `lib/`, `app/` and `components/`: the only `profiles` writes are `updateMyProfile` (name/phone/avatar), `updateMyAvatar`, `removeMyAvatar`, `assignPortalAndRole` (portal + role_id) and `setProfileActive`. Every client-visibility policy resolves through `private.current_org_id()`. The live client account has `organization_id = NULL` and therefore sees nothing.
**Blast radius:** all 23 client routes, plus client-side invoices, messages, deliverables, meetings, reports, reviews and support.
**Fix:** add `organization_id` to `assignPortalAndRole` (or a dedicated `linkProfileToOrganization` action) with a `guard_organization_membership`-compatible admin check, and surface it in `/admin/settings/users` and `/admin/clients`.

### P1 — CRITICAL (core business workflow broken)

| # | Finding | Where |
|---|---|---|
| **P1-1** | **Messaging cannot start** — no `createChannel` / `addParticipant`. 0 channels, 0 participants, 0 messages. | `message-actions.ts` |
| **P1-2** | **Kanban is move-only** — no `createTask` / `deleteTask`. Staff cannot create work. | `task-actions.ts` |
| **P1-3** | **Milestones are read-only** — no create/update. The 7 live rows came from a demo seed file. | `project-queries.ts` |
| **P1-4** | **Deliverables cannot be created** — the review/annotation UI is complete and has nothing to review. | `deliverable-actions.ts` |
| **P1-5** | **Fabricated revenue chart on `/admin`** — ~$628k of invented revenue over 0 invoices. | `RevenueChart.tsx:9` |
| **P1-6** | **`/services` links to no service page** — the catalogue is unreachable from its own index. | `app/(public)/services/page.tsx` |
| **P1-7** | **Staff tiers unenforced at the DB** — every staff member sees every project, file, deliverable and meeting. | `0008_projects.sql:188` |
| **P1-8** | **No rate limiting** on `submit_lead()` / `subscribe_newsletter()` / auth. Dependency installed, never used. | — |
| **P1-9** | **No 2FA enrolment** — `mfa.enroll` appears nowhere; the verify flow can never be reached. | `auth-actions.ts` |
| **P1-10** | **No email whatsoever** — invoice sending, meeting confirmation/reminders, review requests, client welcome, staff invites all depend on it. | — |
| **P1-11** | **No payment processing** — `PaymentPanel` is an explicit stub. | `PaymentPanel.tsx:143` |
| **P1-12** | **No `/admin/meetings`** — the meetings module has a schema, a create action and no admin surface. | route inventory |
| **P1-13** | **Lead → Client conversion does not exist** — the pipeline's central hand-off is manual re-keying. | — |

### P2 — HIGH

P2-1 NotificationBell inert on 31 screens (R-1) · P2-2 GA4 & custom scripts saved but never emitted (M-3) — **fix together with S-7 to avoid opening stored XSS** · P2-3 Route→module map covers 11/36 admin routes · P2-4 `slow_queries`/`database_health` executable by any authenticated user · P2-5 `content_details` has no write path (one blog post already orphaned) · P2-6 `project_milestones` not in realtime publication · P2-7 Newsletter panel on `/blog` discards emails while a working path exists · P2-8 Dead CTAs ("Run System Audit", "Continue with Google") · P2-9 `test-price` published on the public site · P2-10 Expiring design-tool CDN images in 5 files · P2-11 No schema validation (Zod) on any server action · P2-12 Homepage missing 6 of 10 spec sections · P2-13 No JSON-LD anywhere · P2-14 Hardcoded SLA/IP contractual claims on `/pricing` · P2-15 `project_services` never written — no service→project traceability · P2-16 Verify `.env.local` is gitignored; **rotate the anon key** · P2-17 No admin analytics charts (0 of 8) · P2-18 No project templates · P2-19 No client campaign reports/PDF.

### P3 — MEDIUM

18 published realtime tables with no subscriber · unfiltered broad subscriptions (R-4/R-5) · `temporary_grants` and `capabilities` are schema without any UI · no CLIENT role row · hard deletes with no archive/restore · demo seed data in production · `anon` EXECUTE on reorder RPCs · no virus scanning on uploads · leaked-password check not applied to admin-set passwords · terminology drift (Command Center vs Admin) · colour palette diverges from spec §3.2 · WCAG AA unverified · wildcard `remotePatterns` image host · no ISR/revalidation strategy · legal text in code not CMS · no README/architecture docs.

### P4 — LOW

`DataTable.tsx` and `MediaPicker.tsx` are dead code (20 KB) · `scripts/sync-types.mjs` is 0 bytes · `git_diff.txt`, `git_status.txt`, `diagram*.svg`, `tsconfig.tsbuildinfo` committed to the repo root · `@upstash/*` unused dependencies · `keyword_rankings` has no delete · `.staff.mjs` / `push.ps1` deleted but unstaged.

---

## 17. Recommended fix order

**Sprint 1 — make the system operable (unblocks everything else)**
1. **P0-1** — write `profiles.organization_id`. Nothing downstream matters until this exists.
2. **P1-1** — `createChannel` + `addParticipant`; auto-create a project channel on `createProject`.
3. **P1-2 / P1-3 / P1-4** — `createTask`, `deleteTask`, milestone CRUD, `createDeliverable` + `createDeliverableVersion`.
4. **P1-5** — replace `RevenueChart` with a query over `invoice_totals`. One file. Highest credibility-per-hour fix in the audit.
5. **P1-6** — rebuild `/services` from `listPublishedServices()`.

**Sprint 2 — close the security gaps**
6. **P1-7** — rewrite `projects_select` and `can_see_project()` around `project_assignments`.
7. **P1-8** — rate limit `submit_lead`, `subscribe_newsletter` and auth (Upstash is already installed).
8. **P1-9** — 2FA enrolment UI in all three settings pages.
9. **P2-3 / P2-4** — complete `routeModuleMap`; restrict the infrastructure RPCs.
10. **P2-16** — verify `.gitignore`; rotate the anon key.

**Sprint 3 — connect what is already built**
11. **P2-1** — feed `NotificationBell` from `listNotifications()` in each portal layout; add `/client/notifications`.
12. **P2-2 + S-7** — emit GA4/scripts **with sanitisation and a CSP**, or remove the fields.
13. **P2-5** — `content_details` editing in `PageEditor`; backfill `blog/shipping-on-the-edge`.
14. **P2-6** — publish `project_milestones` to realtime; add filters to broad subscriptions.
15. **P2-7** — point the blog newsletter panel at `subscribeToNewsletter()`.
16. **P2-8 / P2-9 / P2-10** — remove or wire the dead CTAs; unpublish `test-price`; self-host the images.

**Sprint 4 — the missing third of the product**
17. Email provider (Resend) → invoice send, meeting confirm/remind, review request, client welcome, staff invite.
18. Payment processor → `PaymentPanel`, invoice PDF, recurring invoices, reminders.
19. `/admin/meetings` + availability + calendar; lead→client conversion action.
20. Admin analytics charts; client campaign reports.

**Sprint 5 — hardening**
21. Zod on every server action. Playwright E2E on the five critical workflows (it is already a devDependency). Lighthouse CI. Sentry. Soft-delete/archive. README + architecture doc.

---

## 18. Direct answers to the questions asked

**What does the documentation say the application should be?**
A full-stack agency platform: a conversion-focused public marketing site, a dynamic service catalogue, calendar-based meeting booking, and three role-gated portals (Admin, Staff, Client) covering CRM, projects with a Trello-style board, invoicing with Stripe and local payments, analytics with GA4, reviews, and a CMS — built on Next.js 14 + PostgreSQL + Prisma + NextAuth + Stripe + Resend + Pusher, with 2FA, rate limiting and an immutable audit log.

**What does the codebase currently implement?**
A Next.js 14 App Router application on Supabase (Auth + Postgres + Realtime + Storage) with 91 routes, ~200 server actions and queries across 50 modules, and 61 migrations producing 51 fully RLS-protected tables. The admin portal is largely real. The CMS/page-builder is genuinely good. Auth is solid. The database design is the strongest artefact in the project.

**What actually works end to end?**
Authentication (sign-in, sign-up, reset, portal routing, deactivation). The contact/book-meeting form → `leads` → CRM pipeline. The CMS: create page → edit blocks → save draft → publish → public render → sitemap. Service catalogue administration. Staff roster and allocation. Media library. Invoice creation and payment recording (admin-side only). Review moderation. SEO keyword tracking (manual data). Audit logging. API-key registry. Support tickets. Access-control matrix editing. **That is roughly 12 complete workflows.**

**What only appears to work because of mock/static data?**
The admin revenue chart (M-1). The blog newsletter panel (M-2). The About page's "live" agency telemetry and leadership roster (M-4, M-5). The `/services` marketing page (M-6). GA4/script settings that save and do nothing (M-3). Four dead buttons (M-7).

**Which features are not connected to PostgreSQL?**
`/services` (public), the homepage's capability cards and stack strip, `/pricing`'s comparison table, `/contact`'s channel and social lists, `lib/legal.ts`, `lib/agency.ts`, `lib/team.ts`, `RevenueChart`, the blog `NewsletterPanel`, and both public header/footer nav arrays.

**Which operations do not persist?**
Blog newsletter signups. Meeting recordings and file downloads (never stored). GA4/script settings persist but are never *used*. Everything else that reaches a server action does persist.

**Which realtime workflows are missing or broken?**
Notifications → any UI (the bell is empty everywhere). Meetings ↔ participants. Support tickets ↔ agents. Project milestones → client. Time entries → admin. Client-side messaging and invoices are *coded* correctly but blocked by P0-1 and P1-1.

**Can Admin, Staff, Client and Public users communicate and synchronise correctly?**
**No.** Public → Admin works (leads). Admin ↔ Staff works for projects and tasks. Staff ↔ Client and Admin ↔ Client **cannot communicate at all** — no message channel can be created, and the client account cannot see its own organisation's data.

**Are roles and permissions actually enforced at the database level?**
**Partially, and better than most.** RLS is on all 51 tables with real policies; the permission matrix is a database table, not code; privilege-escalation triggers work; `is_admin()` correctly requires a grant rather than just a portal. **But** staff tiers are not enforced (`current_portal() = 'STAFF'` sees everything), clients have no role row, and the route-level map covers under a third of admin routes.

**Which workflows are incomplete?**
Lead→Client conversion · client onboarding · project setup (tasks/milestones) · deliverable delivery and approval · all messaging · meeting booking and management · payment collection · review solicitation · campaign reporting · notification delivery.

**Which requirements are completely missing?**
Email (all of it) · payments (all of it) · meeting calendar and availability · admin meetings module · project templates · admin analytics charts · client campaign reports · GA4/GTM/Hotjar/GSC/Pixel · JSON-LD · trust-and-conversion elements · client onboarding tour · 2FA enrolment · rate limiting · virus scanning · search · tests · error monitoring · expense and tax management · CSV/Excel export · bulk client email · client merge.

**What architecture problems must be fixed?**
(1) The org-linking gap — a one-column write that gates a quarter of the product. (2) Missing create paths as a *pattern* — five subsystems have read/update/delete and no create; adopt a rule that no table ships without a complete lifecycle. (3) RLS scoping by portal rather than by assignment. (4) `routeModuleMap` drifting behind the route tree with no test to catch it. (5) No validation layer between `FormData` and the database. (6) Realtime publication and subscription lists maintained independently and already out of sync in both directions.

**What must be done before production?**
P0-1, all thirteen P1s, and P2-1 through P2-4 and P2-16. Realistically **6–9 weeks** for one experienced full-stack engineer, of which the email and payment integrations are roughly half.

**What is the honest overall completion percentage?**

> ## ~52%

Weighted: database & schema 85% · auth 80% · admin portal 72% · public site 65% · staff portal 48% · client portal 22% · integrations 5% · testing & observability 0%.

The uncomfortable framing: **the hard 60% is done and the easy 40% is not.** Someone built an excellent database, a correct realtime layer, a real permission system and a working CMS — and then stopped before writing the handful of `INSERT` paths that would let anyone use them. That is unusual, and it is good news: the remaining work is mostly additive, low-risk, and does not require re-architecting anything.

---

## 19. Audit limitations — stated plainly

1. **No runtime verification.** Agreed scope was static + live DB reads. Claims about *rendering* (empty states, layout, hydration) are inferred from code and row counts. Nothing here was clicked.
2. **`npm run build` / `tsc --noEmit` / `next lint` were not run** — the device-side Linux workspace failed to start, so the repository was read via file staging rather than executed. **There may be type or lint errors this audit did not catch.** Run all three before acting on anything.
3. **No test suite exists**, so there is no regression signal for any fix proposed here.
4. The live database is a **development database with production characteristics** (real admin account, demo seed rows, a published `test-price` page). Some emptiness may reflect "not yet used" rather than "cannot be used" — except where a missing code path is proven, which is stated explicitly each time.
5. `git_status.txt` in the repo root is stale (references files that no longer exist) and was not used as evidence.
6. Two large files were read only in part: `AccessControlConsole.tsx` (36 KB) and `PageEditor.tsx` (41 KB). Both were grepped for the specific claims made about them.

---

*Audit performed against `E:\agency` @ `main` and Supabase project `wiajwelffyzfeznlftcy`, 8 August 2026. No files were modified. No database writes were made.*
