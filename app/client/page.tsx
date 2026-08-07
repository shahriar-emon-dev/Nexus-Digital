import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronRight,
  MessagesSquare,
  Landmark,
  Mail,
  MoveRight,
  Rocket,
  ShieldCheck,
  Store,
  Video,
  VideoIcon,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { healthTone, type PortalProject } from "@/lib/client-portal";
import {
  getClientAccount,
  getNextMeeting,
  getPortalKpis,
  getRecentMessages,
} from "@/lib/supabase/account-queries";
import { listProjects } from "@/lib/supabase/project-queries";
import { listPublicStaff } from "@/lib/supabase/staff-queries";
import { Avatar, AvatarFallback, AvatarGroup, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ActionFab } from "@/components/client/ActionFab";

export const metadata: Metadata = { title: "Overview" };

const kpiIcons: Record<string, LucideIcon> = {
  projects: Rocket,
  milestone: CalendarDays,
  messages: Mail,
  billing: Wallet,
};

// Must cover every `PortalProject["icon"]` value — a gap here resolves to
// `undefined` and Next fails the route with "Unsupported Server Component type".
const projectIcons: Record<PortalProject["icon"], LucideIcon> = {
  bank: Landmark,
  ai: Bot,
  store: Store,
  chart: BarChart3,
  shield: ShieldCheck,
};

const tone = {
  brand: { text: "text-brand", bar: "bg-brand", chip: "bg-brand/10 text-brand" },
  ion: { text: "text-ion", bar: "bg-ion", chip: "bg-ion/10 text-ion" },
  orchid: { text: "text-chart-3", bar: "bg-chart-3", chip: "bg-chart-3/10 text-chart-3" },
} as const;

export default async function ClientOverviewPage() {
  const [account, kpis, projects, messages, meeting, staff] = await Promise.all([
    getClientAccount(),
    getPortalKpis(),
    listProjects(),
    getRecentMessages(),
    getNextMeeting(),
    listPublicStaff(),
  ]);

  const memberById = (id: string) => staff.find((m) => m.id === id);
  const inFlight = projects.filter((p) => p.status === "Active").slice(0, 3);
  const health = account?.health ? healthTone[account.health] : null;

  return (
    <>
      <DashboardHeader
        title="Overview"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Overview" }]}
      />

      <div className="flex flex-col gap-10 px-5 py-12 lg:px-10">
        {/* ── Welcome + health ───────────────────────────────────────────── */}
        <Card
          variant="glass"
          className="beam-rotate flex-col items-center justify-between gap-8 rounded-3xl p-10 md:flex-row"
        >
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="font-heading text-[3rem] leading-[1.2] font-bold tracking-tight text-balance text-ink">
              Welcome back,{" "}
              <span className="text-brand">{account?.name ?? "there"}.</span>
            </h2>
            {/* Only rendered when an account manager has actually written one.
                The copy this replaces claimed every client was "performing at
                peak efficiency" against benchmarks nothing measured. */}
            {account?.welcome && (
              <p className="max-w-xl text-lg leading-relaxed text-ink-secondary">
                {account.welcome}
              </p>
            )}
          </div>

          {/* A gauge would imply a measured percentage. `organizations.health`
              is a state an account manager sets, so it is shown as the state it
              is, with its provenance named. */}
          {health && (
            <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-sunken p-6 text-center">
              <p className="text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                Account status
              </p>
              <Badge variant={health.tone} className="text-base">
                {health.label}
              </Badge>
              <p className="max-w-[14rem] text-[0.8125rem] text-ink-tertiary">
                Recorded by your account manager.
              </p>
            </div>
          )}
        </Card>

        {/* ── KPIs ───────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpiIcons[kpi.icon];
            const t = tone[kpi.tone];
            return (
              <Card
                key={kpi.id}
                variant="glass"
                lift
                className={cn(
                  "justify-between rounded-2xl p-6",
                  kpi.emphasis && "border-l-2 border-l-brand"
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn("grid size-9 place-items-center rounded-lg", t.chip)}>
                    <Icon className="size-5" aria-hidden />
                  </span>

                  {kpi.href && (
                    <Link
                      href={kpi.href}
                      aria-label={`Open ${kpi.label}`}
                      className="rounded-sm text-ink-tertiary transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    >
                      <ArrowUpRight className="size-5" aria-hidden />
                    </Link>
                  )}
                  {kpi.badge && (
                    <Badge variant="danger" size="sm" className="tracking-tight uppercase">
                      {kpi.badge.label}
                    </Badge>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-[0.8125rem] text-ink-tertiary">{kpi.label}</h3>
                  <p
                    data-tabular
                    className={cn(
                      "mt-1 font-heading font-semibold text-ink",
                      kpi.note ? "truncate text-base" : "text-[2rem] leading-tight"
                    )}
                  >
                    {kpi.value}
                  </p>
                  {kpi.note && (
                    <p className={cn("mt-1 text-[0.8125rem]", t.text)}>{kpi.note}</p>
                  )}
                  {kpi.action && (
                    <Button
                      size="sm"
                      className="mt-4 w-full transition-transform hover:scale-[1.02]"
                      render={<Link href={kpi.action.href} />}
                    >
                      {kpi.action.label}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </section>

        {/* ── Project velocity ───────────────────────────────────────────── */}
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
              Active Projects Velocity
            </h2>
            <Button
              variant="link"
              size="sm"
              className="gap-2 transition-[gap] duration-(--duration-normal) hover:gap-3"
              render={<Link href="/client/projects" />}
            >
              View All Projects
              <MoveRight />
            </Button>
          </div>

          <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {inFlight.map((project) => {
              const Icon = projectIcons[project.icon];
              const t = tone[project.tone];
              const lead = memberById(project.leadId);
              return (
                <li key={project.id}>
                  <Card variant="glass" lift className="h-full gap-6 rounded-2xl p-8">
                    <div className="flex items-center gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-surface-sunken">
                        <Icon className={cn("size-5", t.text)} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading text-[1.375rem] leading-tight font-semibold text-ink">
                          {project.name}
                        </h3>
                        {lead && (
                          <p className="text-[0.8125rem] text-ink-tertiary">
                            Lead: {lead.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[0.8125rem]">
                        <span className="text-ink-tertiary">Progress</span>
                        <span data-tabular className={cn("font-bold", t.text)}>
                          {project.progress}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-line"
                        role="progressbar"
                        aria-label={`${project.name} progress`}
                        aria-valuenow={project.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={cn(
                            "h-full rounded-full",
                            t.bar,
                            // The design glows only the leading project's bar.
                            project.tone === "brand" &&
                              "shadow-[0_0_20px_var(--brand-glow)]"
                          )}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-surface-sunken p-4">
                      <p className="mb-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                        Current Stage
                      </p>
                      <p className="font-medium text-ink">{project.stage}</p>
                    </div>

                    <Button
                      variant="outline"
                      className={cn("mt-auto w-full rounded-xl", t.text)}
                      render={<Link href={project.href} />}
                    >
                      View Project Board
                      <ChevronRight />
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Communications + meetings ──────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-2">
          <Card variant="glass" lift className="rounded-2xl">
            <div className="flex items-center justify-between border-b border-line p-6">
              <h2 className="font-heading text-xl font-semibold text-ink">
                Recent Communications
              </h2>
              <MessagesSquare className="size-5 text-ink-tertiary" aria-hidden />
            </div>

            <ul className="p-2">
              {messages.length === 0 && (
                <li className="px-4 py-10 text-center text-[0.8125rem] text-ink-tertiary">
                  No messages yet. Your project channel opens as soon as work starts.
                </li>
              )}
              {messages.map((message) => (
                <li key={message.id}>
                  <Link
                    href="/client/messages"
                    className="flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-none"
                  >
                    <Avatar size="default" className="rounded-lg">
                      <AvatarFallback>{initials(message.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="font-semibold text-ink">{message.authorName}</span>
                        <span className="shrink-0 text-[0.8125rem] text-ink-tertiary">
                          {message.time}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-[0.8125rem] text-ink-secondary">
                        {message.preview}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Button
              variant="ghost"
              className="mt-auto w-full rounded-none rounded-b-2xl py-4"
              render={<Link href="/client/messages" />}
            >
              Open Conversation Center
            </Button>
          </Card>

          <Card variant="glass" lift className="rounded-2xl">
            <div className="flex items-center justify-between border-b border-line p-6">
              <h2 className="font-heading text-xl font-semibold text-ink">Upcoming Meetings</h2>
              <VideoIcon className="size-5 text-ink-tertiary" aria-hidden />
            </div>

            <div className="flex flex-col items-center gap-6 p-8 text-center">
              <span className="relative grid size-20 place-items-center rounded-full bg-brand/10">
                <CalendarDays className="size-10 text-brand" aria-hidden />
              </span>

              {meeting ? (
                <>
                  <div>
                    <h3 className="font-heading text-2xl font-semibold text-ink">
                      {meeting.title}
                    </h3>
                    <p className="mt-2 text-ink-tertiary">
                      {meeting.when} • {meeting.durationMinutes} minutes
                    </p>
                  </div>

                  <AvatarGroup
                    people={meeting.attendees.map((a) => ({ name: a.name }))}
                    size="sm"
                    max={4}
                  />

                  <Button
                    size="xl"
                    className="rounded-xl px-12 shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
                    render={<Link href="/client/meetings" />}
                  >
                    Join Video Room
                    <Video />
                  </Button>
                </>
              ) : (
                /* A real empty state. The card used to hard-code a red "1"
                   badge, so it announced a meeting even with none scheduled. */
                <>
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-ink">
                      Nothing scheduled
                    </h3>
                    <p className="mt-2 text-ink-tertiary">
                      When your team books a session it will appear here.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl"
                    render={<Link href="/client/meetings" />}
                  >
                    Request a meeting
                  </Button>
                </>
              )}
            </div>
          </Card>
        </section>
      </div>

      <ActionFab />
    </>
  );
}
