import type { Locale } from "@/i18n/routing";
import { SOURCE_LOCALE, type I18nMap } from "./fields";

/**
 * Every content table with machine-translated `<field>_i18n` columns.
 * Register new translatable fields HERE — the admin status page and the
 * bulk backfill both derive their work from this list.
 */
export const TRANSLATABLE_TABLES = [
  { table: "menu_items", label: "Speisen", fields: ["name", "description"], labelField: "name_de" },
  { table: "menu_categories", label: "Kategorien", fields: ["name", "description"], labelField: "name_de" },
  { table: "pages", label: "Seiten", fields: ["title", "content"], labelField: "title_de" },
  { table: "restaurant_settings", label: "Einstellungen", fields: ["description"], labelField: "name" },
  { table: "allergens", label: "Allergene", fields: ["name"], labelField: "name_de" },
  { table: "additives", label: "Zusatzstoffe", fields: ["name"], labelField: "name_de" },
] as const;

export type TranslatableTableConfig = (typeof TRANSLATABLE_TABLES)[number];

/**
 * Which of the given target locales are still missing for one field, given
 * its `<field>_i18n` map and the DE source text. The DE source itself is
 * never a target; no source → nothing to translate → empty list.
 */
export function missingLocales(
  i18n: unknown,
  source: string | null | undefined,
  targets: readonly Locale[],
): Locale[] {
  if (!source || !source.trim()) return [];
  const map = (i18n && typeof i18n === "object" ? i18n : {}) as I18nMap;
  return targets.filter(
    (l) => l !== SOURCE_LOCALE && (typeof map[l] !== "string" || !map[l].trim()),
  );
}

/** Merges the per-field gaps of one row into a unique, locale-ordered list. */
export function missingForRow(
  row: Record<string, unknown>,
  fields: readonly string[],
  targets: readonly Locale[],
): Locale[] {
  const missing = new Set<Locale>();
  for (const f of fields) {
    for (const l of missingLocales(row[`${f}_i18n`], row[`${f}_de`] as string | null, targets)) {
      missing.add(l);
    }
  }
  return targets.filter((l) => missing.has(l));
}
