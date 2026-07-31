/**
 * Scheduled and past meetings for the client portal.
 *
 * Shaped for the eventual `Meeting` table. `lib/client-portal.ts` derives its
 * overview card from `nextMeeting` here, so the "Upcoming Meetings" panel and
 * this page cannot disagree about what is next or when.
 *
 * Must not import `lib/client-portal.ts` — that module reads this one.
 */
import type { TeamMember } from "./team";

export type MeetingKind = "Review" | "Workshop" | "Standup" | "Handover";

export const meetingKindTone: Record<MeetingKind, "brand" | "ion" | "default" | "success"> = {
  Review: "brand",
  Workshop: "ion",
  Standup: "default",
  Handover: "success",
};

export type MeetingStatus = "Scheduled" | "Live" | "Completed" | "Cancelled";

export type Meeting = {
  id: string;
  title: string;
  kind: MeetingKind;
  status: MeetingStatus;
  /** ISO 8601 with an offset, so the render is in the reader's timezone. */
  startsAt: string;
  durationMinutes: number;
  attendeeIds: TeamMember["id"][];
  extraAttendees: number;
  /** `PortalProject["id"]`. Loose to avoid a circular import. */
  projectId?: string;
  agenda: string[];
  /** Completed meetings only. */
  recap?: { summary: string; recordingMinutes: number; actions: string[] };
};

export const meetings: Meeting[] = [
  {
    id: "m-strategy-aug",
    title: "Technical Strategy Review",
    kind: "Review",
    status: "Scheduled",
    startsAt: "2026-08-01T14:00:00Z",
    durationMinutes: 60,
    attendeeIds: ["sarah-chen", "alex-vance"],
    extraAttendees: 3,
    projectId: "site-rebuild",
    agenda: [
      "Frontend integration progress against the sprint plan",
      "Checkout verification: biometric fallback behaviour",
      "Open questions on the catalogue data contract",
    ],
  },
  {
    id: "m-brand-uat",
    title: "Brand Refresh — UAT walkthrough",
    kind: "Workshop",
    status: "Scheduled",
    startsAt: "2026-08-05T09:30:00Z",
    durationMinutes: 90,
    attendeeIds: ["marcus-thorne", "elara-kent"],
    extraAttendees: 1,
    projectId: "brand-refresh",
    agenda: [
      "Component library acceptance pass",
      "Motion language sign-off",
      "Guidelines site launch checklist",
    ],
  },
  {
    id: "m-weekly-standup",
    title: "Weekly delivery standup",
    kind: "Standup",
    status: "Scheduled",
    startsAt: "2026-08-07T08:00:00Z",
    durationMinutes: 20,
    attendeeIds: ["sarah-chen"],
    extraAttendees: 4,
    agenda: ["Blockers", "This week's milestones"],
  },
  {
    id: "m-analytics-handover",
    title: "Analytics Rebuild handover",
    kind: "Handover",
    status: "Completed",
    startsAt: "2026-02-14T15:00:00Z",
    durationMinutes: 75,
    attendeeIds: ["elara-kent", "sarah-chen"],
    extraAttendees: 2,
    projectId: "analytics-rebuild",
    agenda: ["Dashboard walkthrough", "Runbook", "Ownership transfer"],
    recap: {
      summary:
        "Warehouse-native attribution signed off. Reporting ownership moved to the in-house data team.",
      recordingMinutes: 72,
      actions: [
        "Nexus to leave the staging warehouse up for 30 days",
        "Northwind to nominate a dashboard owner",
      ],
    },
  },
  {
    id: "m-paid-media-kickoff",
    title: "Paid Media Q4 kickoff",
    kind: "Workshop",
    status: "Completed",
    startsAt: "2026-03-05T13:00:00Z",
    durationMinutes: 60,
    attendeeIds: ["elara-kent", "alex-vance"],
    extraAttendees: 0,
    projectId: "paid-media",
    agenda: ["Channel audit findings", "Measurement plan", "Budget guardrails"],
    recap: {
      summary:
        "Agreed margin-weighted bidding as the target model, pending finance sign-off on the per-SKU margin table.",
      recordingMinutes: 58,
      actions: ["Finance to return the completed margin sheet"],
    },
  },
];

const byStart = (a: Meeting, b: Meeting) => a.startsAt.localeCompare(b.startsAt);

export const upcomingMeetings = meetings
  .filter((m) => m.status === "Scheduled" || m.status === "Live")
  .sort(byStart);

/** Most recent first — the opposite order, because recency is what matters. */
export const pastMeetings = meetings
  .filter((m) => m.status === "Completed")
  .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

/** What the overview counts down to. One source, two surfaces. */
export const nextMeeting = upcomingMeetings[0];

export const meetingStats = {
  upcoming: upcomingMeetings.length,
  past: pastMeetings.length,
  hoursScheduled:
    Math.round(
      (upcomingMeetings.reduce((sum, m) => sum + m.durationMinutes, 0) / 60) * 10
    ) / 10,
};

/**
 * Whole days until the meeting. Negative once it is past, so callers can tell
 * "in 3 days" from "3 days ago" without a second field.
 */
export function daysUntil(iso: string, now = new Date()) {
  const then = new Date(iso);
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate());
  return Math.round((target - start) / 86_400_000);
}

/** "Today", "Tomorrow", or the weekday — how people actually refer to dates. */
export function relativeDay(iso: string, now = new Date()) {
  const days = daysUntil(iso, now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return null;
}
