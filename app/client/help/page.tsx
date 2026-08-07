import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, LifeBuoy, MessagesSquare, Receipt, Rocket } from "lucide-react";

import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Help" };

/**
 * Orientation for the portal.
 *
 * Was a placeholder. Deliberately not a fake knowledge base with invented
 * article counts — it explains what each area of the portal does and where to
 * get a human, which is the whole of what this screen can honestly offer.
 */
const areas = [
  {
    icon: Rocket,
    title: "Projects",
    body: "Progress, milestones and the task board for everything we are building for you. Work waiting on your approval is marked.",
    href: "/client/projects",
    action: "Open projects",
  },
  {
    icon: MessagesSquare,
    title: "Messages",
    body: "One channel per project, plus any direct line your account manager opens. Replies arrive live — no refresh needed.",
    href: "/client/messages",
    action: "Open messages",
  },
  {
    icon: Receipt,
    title: "Invoices",
    body: "Every invoice raised against your account, what is outstanding, and the payments we have received.",
    href: "/client/invoices",
    action: "Open invoices",
  },
  {
    icon: CalendarDays,
    title: "Meetings",
    body: "Sessions you are invited to, with their agenda. Accept or decline from the meeting itself.",
    href: "/client/meetings",
    action: "Open meetings",
  },
];

export default function ClientHelpPage() {
  return (
    <>
      <DashboardHeader
        title="Help"
        description="What each part of the portal does, and how to reach us."
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Help" }]}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 lg:px-8">
        <Card variant="glass" className="gap-3 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
            <LifeBuoy className="size-5 text-brand" aria-hidden />
            Need a person?
          </h2>
          <p className="max-w-xl text-ink-tertiary">
            Open a support request and it goes straight to the team with a reference you can
            quote. You will see every reply here and get a notification when one arrives.
          </p>
          <Link
            href="/client/support"
            className="w-fit rounded-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none"
          >
            Open a support request
          </Link>
        </Card>

        <ul className="grid gap-4 sm:grid-cols-2">
          {areas.map((area) => (
            <li key={area.title}>
              <Card variant="glass" className="h-full gap-3 rounded-2xl p-6">
                <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">
                  <area.icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-heading text-lg font-semibold text-ink">{area.title}</h3>
                <p className="flex-1 text-[0.9375rem] text-ink-tertiary">{area.body}</p>
                <Link
                  href={area.href}
                  className="w-fit rounded-sm text-[0.875rem] font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none"
                >
                  {area.action}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
