import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  FolderKanban,
  MessagesSquare,
  Plus,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { StatCard } from "@/components/shared/StatCard";

const projects = [
  { name: "Site rebuild", phase: "Sprint 14 · Build", progress: 68, due: "12 Sep", lead: "Dez Okafor" },
  { name: "Paid media — Q3", phase: "Optimisation", progress: 41, due: "30 Sep", lead: "Mira Kaur" },
  { name: "Brand refresh", phase: "Concepts", progress: 22, due: "18 Oct", lead: "Sam Ellery" },
];

const activity = [
  { who: "Dez Okafor", what: "moved Category taxonomy v2 to In review", when: "12 min ago" },
  { who: "Mira Kaur", what: "uploaded August-performance.pdf", when: "2 hours ago" },
  { who: "Sam Ellery", what: "completed Design system rollout", when: "Yesterday" },
  { who: "Dez Okafor", what: "replied to your comment on Checkout rebuild", when: "Yesterday" },
];

export default function ClientOverviewPage() {
  return (
    <>
      <DashboardHeader
        title="Good afternoon, Priya"
        description="Three projects are moving. One invoice needs your attention."
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Overview" }]}
        actions={
          <Button size="sm">
            <Plus />
            Request work
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-5 py-6 lg:px-8">
        <Alert tone="warning">
          <AlertTitle>Invoice INV-2043 is 4 days overdue</AlertTitle>
          <AlertDescription>
            $12,400 for August retainer. Paying now keeps the September sprint on schedule.
          </AlertDescription>
          <div className="mt-2">
            <Button size="sm" variant="outline" render={<Link href="/client/invoices" />}>
              Review invoice
              <ArrowRight />
            </Button>
          </div>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active projects" value="3" caption="1 shipping this month" icon={FolderKanban} />
          <StatCard
            label="Hours this month"
            value="248"
            delta="+18"
            direction="up"
            caption="of 260 retained"
            icon={CalendarDays}
            series={[180, 196, 210, 224, 231, 240, 248]}
          />
          <StatCard label="Unread messages" value="5" caption="Across 2 projects" icon={MessagesSquare} />
          <StatCard
            label="Outstanding"
            value="$12,400"
            delta="Overdue"
            direction="down"
            positiveIsGood
            caption="1 invoice"
            icon={CircleDollarSign}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Your projects</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 pt-4">
              {projects.map((project) => (
                <div key={project.name} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/client/projects"
                      className="text-sm font-medium text-ink hover:underline"
                    >
                      {project.name}
                    </Link>
                    <Badge variant="outline" size="sm">
                      {project.phase}
                    </Badge>
                    <span
                      data-tabular
                      className="ml-auto text-xs text-ink-tertiary"
                    >
                      {project.progress}% · due {project.due}
                    </span>
                  </div>
                  <Progress value={project.progress} aria-label={`${project.name} progress`} />
                  <p className="text-xs text-ink-tertiary">Led by {project.lead}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="flex flex-col gap-4">
                {activity.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <Avatar size="xs" className="mt-0.5">
                      <AvatarFallback>{initials(item.who)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] leading-snug text-ink-secondary">
                        <span className="font-medium text-ink">{item.who}</span> {item.what}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-ink-tertiary">{item.when}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                render={<Link href="/client/messages" />}
              >
                Open messages
                <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
