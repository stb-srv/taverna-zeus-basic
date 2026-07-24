/**
 * Public display name for a submitted review: "Vorname N." — the full last
 * name and the email stay server-side (anon cannot read those columns).
 */
export function publicReviewName(firstName: string, lastName: string | null): string {
  const first = firstName.trim();
  const last = (lastName ?? "").trim();
  if (!last) return first;
  return `${first} ${last[0]}.`;
}
