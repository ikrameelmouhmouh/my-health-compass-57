/**
 * Local-timezone date helpers.
 *
 * Do NOT use `new Date().toISOString().slice(0, 10)` for "today from the
 * user's perspective" — that returns the UTC calendar date. In Amsterdam
 * summer (UTC+2), between 00:00 and 02:00 local the UTC date is still
 * yesterday, so "today" filters silently show yesterday's data.
 *
 * Use these helpers for anything the user reads as a day (dashboard,
 * streaks, workout-of-today, nutrition day totals, fasting grid).
 */

/** YYYY-MM-DD in the browser's local timezone. */
export function localDayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today, formatted YYYY-MM-DD in the browser's local timezone. */
export const todayLocalKey = () => localDayKey(new Date());
