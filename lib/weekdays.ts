/**
 * Weekday labels for availability rules.
 *
 * Lives outside `availability-actions.ts` because that module carries the
 * "use server" directive, and a Server Actions file may only export async
 * functions — exporting a plain array from it compiles under `tsc` and then
 * fails the production build with "a 'use server' file can only export async
 * functions, found object". Constants belong in a plain module.
 *
 * Indexed to match Postgres and JavaScript's `getDay()`, where 0 is Sunday.
 */
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
