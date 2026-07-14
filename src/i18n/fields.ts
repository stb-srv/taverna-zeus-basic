import { routing, type Locale } from "@/i18n/routing";
import { translateBatch } from "./translate";

/** locale → value. */
export type I18nMap = Record<string, string>;

/** The authoritative source language for translations. */
export const SOURCE_LOCALE: Locale = routing.defaultLocale;

/** Human-authored locales — "re-translate" never overwrites these. */
export const HUMAN_LOCALES: readonly Locale[] = ["de"];

/** Reads a `<field>_<locale>` set out of submitted form data into an i18n map. */
export function i18nFromForm(get: (key: string) => string, field: string): I18nMap {
  const map: I18nMap = {};
  for (const loc of routing.locales) {
    const v = get(`${field}_${loc}`).trim();
    if (v) map[loc] = v;
  }
  return map;
}

type FieldInput = { i18n: I18nMap; source: string };

/**
 * Fills translations for a set of fields into the given target locales
 * (usually the currently enabled ones — the DE source is always excluded).
 * - `overwrite: false` (default): only fills target locales that are currently
 *   empty — never touches human-edited values.
 * - `overwrite: true`: regenerates the machine locales from the DE source,
 *   leaving the human-authored DE source untouched.
 *
 * Translation failures are non-fatal: the source (and any existing values) are
 * preserved and `ok:false` is returned so the caller can surface a hint.
 */
export async function autofillI18n(
  fields: Record<string, FieldInput>,
  opts: { targets: readonly Locale[]; overwrite?: boolean },
): Promise<{ result: Record<string, I18nMap>; ok: boolean; error?: string }> {
  const overwrite = opts.overwrite ?? false;
  const result: Record<string, I18nMap> = {};
  for (const [name, f] of Object.entries(fields)) result[name] = { ...f.i18n };

  const targets = opts.targets.filter(
    (l) => l !== SOURCE_LOCALE && (!overwrite || !HUMAN_LOCALES.includes(l)),
  );
  let ok = true;
  let error: string | undefined;

  for (const target of targets) {
    // Which fields need this target translated right now?
    const need = Object.entries(fields).filter(([name, f]) => {
      if (!f.source) return false;
      return overwrite ? true : !result[name][target];
    });
    if (need.length === 0) continue;

    const { byLocale, ok: tok, error: terr } = await translateBatch(
      need.map(([, f]) => f.source),
      SOURCE_LOCALE,
      [target],
    );
    if (!tok) {
      ok = false;
      error = terr;
      continue;
    }
    const out = byLocale[target] ?? [];
    need.forEach(([name], i) => {
      if (out[i]) result[name][target] = out[i];
    });
  }

  // Keep the DE source authoritative in the map.
  for (const [name, f] of Object.entries(fields)) {
    if (f.source) result[name][SOURCE_LOCALE] = f.source;
  }

  return { result, ok, error };
}
