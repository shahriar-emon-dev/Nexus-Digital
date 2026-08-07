/**
 * Badge tone maps for the portal entities.
 *
 * These live outside the `"use server"` action modules on purpose: such a file
 * may only export async functions, and exporting a plain object from one fails
 * the build with "A 'use server' file can only export async functions, found
 * object" — a message that names the file but not the export.
 *
 * They are plain strings so `lib/` still imports no components.
 */

import type { Database } from "./supabase/types";

type MeetingKind = Database["public"]["Enums"]["meeting_kind"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type DeliverableStatus = Database["public"]["Enums"]["deliverable_status"];

export const meetingKindTone: Record<MeetingKind, "brand" | "ion" | "default" | "success"> = {
  Review: "brand",
  Workshop: "ion",
  Standup: "default",
  Handover: "success",
};

export const ticketStatusTone: Record<TicketStatus, "warning" | "default" | "success"> = {
  open: "warning",
  pending: "default",
  resolved: "success",
  closed: "default",
};

export const deliverableStatusTone: Record<
  DeliverableStatus,
  "info" | "warning" | "success"
> = {
  "In review": "info",
  "Changes requested": "warning",
  Approved: "success",
};
