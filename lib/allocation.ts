/**
 * Staff capacity behind the admin resource heatmap.
 *
 * Shaped for the eventual `Allocation` table — one row per person per day.
 * The utilisation bands, the conflict list and every KPI on the page are
 * derived from those rows, so the heatmap and the alerts beside it can never
 * disagree. The source design hardcoded both: cells were fixed CSS classes and
 * the conflict cards named people whose rows told a different story.
 */
import { leadership, type TeamMember } from "./team";

/** A standard working week. Anything above this is an overbooking. */
export const WEEKLY_CAPACITY_HOURS = 40;
/** The threshold the conflict panel alerts on. */
export const CONFLICT_THRESHOLD_HOURS = 45;

export type UtilisationBand = "overbooked" | "optimal" | "under" | "off";

/**
 * Bands are ranges, not separate data. A cell's colour and its tooltip both
 * come from the same percentage.
 */
export function bandFor(percent: number): UtilisationBand {
  if (percent === 0) return "off";
  if (percent > 100) return "overbooked";
  if (percent >= 60) return "optimal";
  return "under";
}

export const bandMeta: Record<
  UtilisationBand,
  { label: string; cell: string; dot: string }
> = {
  overbooked: {
    label: "Overbooked",
    cell: "bg-danger/70 hover:bg-danger",
    dot: "bg-danger",
  },
  optimal: {
    label: "Optimised",
    cell: "bg-brand/70 hover:bg-brand",
    dot: "bg-brand",
  },
  under: {
    label: "Underutilised",
    cell: "bg-ion/25 hover:bg-ion/45",
    dot: "bg-ion/40",
  },
  off: {
    label: "Not scheduled",
    cell: "bg-surface-raised hover:bg-surface-sunken",
    dot: "bg-line-strong",
  },
};

export type Seniority = "L1-L3" | "L4-L6" | "Principal";

export type StaffAllocation = {
  memberId: TeamMember["id"];
  seniority: Seniority;
  timezone: string;
  /** Booked hours per day, index 0 = the 1st of the month. */
  daily: number[];
};

/** Hours in a standard working day, used to turn hours into a percentage. */
const DAILY_CAPACITY = WEEKLY_CAPACITY_HOURS / 5;

/** The window the heatmap covers. */
export const monthLabel = "July 2026";
export const DAYS_IN_MONTH = 24;

/** Day-of-week for column headers. 1 July 2026 is a Wednesday. */
export const weekdayFor = (day: number) => "MTWTFSS"[(day + 1) % 7];
export const isWeekend = (day: number) => {
  const dow = (day + 1) % 7;
  return dow === 5 || dow === 6;
};

/**
 * Deterministic bookings. Weekends are zero, which is why the grid reads as a
 * calendar rather than noise.
 */
function schedule(seed: number, intensity: number): number[] {
  const days: number[] = [];
  for (let day = 1; day <= DAYS_IN_MONTH; day += 1) {
    if (isWeekend(day)) {
      days.push(0);
      continue;
    }
    const wave = Math.sin((day + seed) / 3.2);
    const hours = Math.max(0, Math.round((DAILY_CAPACITY * intensity + wave * 2.4) * 2) / 2);
    days.push(hours);
  }
  return days;
}

/**
 * Intensities are tuned so the estate reads as a plausible steady state:
 * ~93% global utilisation with one critical overbooking, one high, one on
 * watch, and one person comfortably clear. Raise them and every specialist
 * lands in the conflict panel, which makes the panel meaningless.
 */
export const allocations: StaffAllocation[] = [
  {
    memberId: "alex-vance",
    seniority: "Principal",
    timezone: "UTC-8",
    daily: schedule(0, 1.12),
  },
  {
    memberId: "marcus-thorne",
    seniority: "L4-L6",
    timezone: "UTC+0",
    daily: schedule(2, 0.88),
  },
  {
    memberId: "sarah-chen",
    seniority: "Principal",
    timezone: "UTC-8",
    daily: schedule(4, 0.94),
  },
  {
    memberId: "elara-kent",
    seniority: "L4-L6",
    timezone: "UTC+8",
    daily: schedule(6, 0.62),
  },
];

export const memberFor = (id: TeamMember["id"]) => leadership.find((m) => m.id === id);

/** Percentage of a day's capacity that is booked. */
export const dayPercent = (hours: number) => Math.round((hours / DAILY_CAPACITY) * 100);

/** Busiest rolling week, which is what an overbooking actually means. */
export function peakWeekHours(daily: number[]) {
  let peak = 0;
  for (let start = 0; start + 7 <= daily.length; start += 1) {
    const week = daily.slice(start, start + 7).reduce((a, b) => a + b, 0);
    if (week > peak) peak = week;
  }
  return peak;
}

export const totalBooked = (daily: number[]) => daily.reduce((a, b) => a + b, 0);

/** Working days only — weekends would drag the average down artificially. */
const workingDays = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).filter(
  (d) => !isWeekend(d)
).length;

export const globalUtilisation =
  (allocations.reduce((sum, a) => sum + totalBooked(a.daily), 0) /
    (allocations.length * workingDays * DAILY_CAPACITY)) *
  100;

export type Conflict = {
  memberId: TeamMember["id"];
  peakHours: number;
  severity: "Critical" | "High" | "Watch";
  detail: string;
};

const severityFor = (hours: number): Conflict["severity"] => {
  if (hours >= 52) return "Critical";
  if (hours >= 48) return "High";
  return "Watch";
};

export const conflictTone: Record<Conflict["severity"], "danger" | "warning" | "default"> = {
  Critical: "danger",
  High: "warning",
  Watch: "default",
};

/**
 * Derived from the same rows the grid draws. A person appears here only if
 * their busiest week actually breaches the threshold.
 */
export const conflicts: Conflict[] = allocations
  .map((allocation) => {
    const peak = peakWeekHours(allocation.daily);
    return {
      memberId: allocation.memberId,
      peakHours: peak,
      severity: severityFor(peak),
      detail: `Peak week is ${(peak - WEEKLY_CAPACITY_HOURS).toFixed(1)} hours over a standard ${WEEKLY_CAPACITY_HOURS}-hour week.`,
    };
  })
  .filter((c) => c.peakHours >= CONFLICT_THRESHOLD_HOURS)
  .sort((a, b) => b.peakHours - a.peakHours);

/** Weekly delivery velocity, in story points. */
export const velocitySeries = [38.5, 44.2, 41.0, 46.8, 42.8];

export const velocityStats = {
  current: velocitySeries[velocitySeries.length - 1],
  previous: velocitySeries[velocitySeries.length - 2],
  get deltaPct() {
    return ((this.current - this.previous) / this.previous) * 100;
  },
};

/** Billable against internal. Two halves of one split, so they always sum. */
export const billableRatio = 87.5;
export const overheadRatio = Number((100 - billableRatio).toFixed(1));

export const departments = [...new Set(leadership.map((m) => m.department))];
export const timezones = [...new Set(allocations.map((a) => a.timezone))];
export const seniorities: Seniority[] = [...new Set(allocations.map((a) => a.seniority))];
