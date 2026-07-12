/** Typed readers for submitted `FormData`, shared by the admin server actions. */

/** Reads a form value as a trimmed string (`""` if missing). */
export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** Like `str`, but empty values become `null` (for nullable DB columns). */
export function strOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

/** Parses a decimal number; accepts a German decimal comma. `null` if empty/invalid. */
export function numOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key).replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Parses an integer, falling back for empty/invalid input. */
export function intOr(fd: FormData, key: string, fallback = 0): number {
  const n = parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
}
