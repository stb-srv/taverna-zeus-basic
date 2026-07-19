/** Pure date-window helpers for the seasonal/holiday closure banner. */

/**
 * True if `today` (ISO `YYYY-MM-DD`) falls within `[from, until]` inclusive.
 * Returns `false` if either bound is missing — a full range is required
 * (separate from the `closure_banner_enabled` flag, which the caller checks
 * on its own).
 */
export function isWithinClosureWindow(
  today: string,
  from: string | null,
  until: string | null,
): boolean {
  if (!from || !until) return false;
  return from <= today && today <= until;
}

/**
 * "Today" in the restaurant's timezone (Germany), as `YYYY-MM-DD`. Servers
 * often run in UTC, so a naive `new Date()` comparison could flip the banner
 * on/off up to 2 hours early/late around midnight CET/CEST.
 */
export function getBerlinToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}
