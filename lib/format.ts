/**
 * Formatters shared by server and client components.
 *
 * These live outside any module that touches `lib/supabase/server.ts`. That
 * file imports `next/headers`, so a client component importing a VALUE from a
 * module that also exports a server query pulls the whole server graph into the
 * browser bundle and fails the build with "You're importing a component that
 * needs next/headers".
 *
 * A type-only import is erased and stays safe; a formatter is not.
 */

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const moneyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** Minutes as something a person reads: "0h", "45m", "2h 30m". */
export function hoursFromMinutes(minutes: number) {
  if (minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
}
