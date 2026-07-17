import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/routing";
import { translateBatch, TRANSLATE_CHUNK_SIZE } from "./translate";
import { SOURCE_LOCALE, type I18nMap } from "./fields";
import { missingForRow, TRANSLATABLE_TABLES } from "./translation-status";

type Row = Record<string, unknown> & { id: string | number };

type Client = SupabaseClient<Database>;

/** The tables come from TRANSLATABLE_TABLES at runtime — access them untyped. */
function loose(supabase: Client): SupabaseClient {
  return supabase as unknown as SupabaseClient;
}

async function selectRows(
  supabase: Client,
  table: string,
  cols: string[],
): Promise<{ rows: Row[]; error?: string }> {
  const { data, error } = await loose(supabase)
    .from(table)
    .select([...new Set(cols)].join(", "));
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as unknown as Row[] };
}

export type TableStatus = {
  table: string;
  label: string;
  /** Rows that still have untranslated locales. */
  gaps: { id: string | number; name: string; missing: Locale[] }[];
  total: number;
};

/** Reads every translatable table and reports which enabled locales are missing per row. */
export async function collectTranslationStatus(
  supabase: Client,
  targets: readonly Locale[],
): Promise<TableStatus[]> {
  const result: TableStatus[] = [];
  for (const cfg of TRANSLATABLE_TABLES) {
    const cols = ["id", cfg.labelField, ...cfg.fields.flatMap((f) => [`${f}_de`, `${f}_i18n`])];
    const { rows } = await selectRows(supabase, cfg.table, cols);
    const gaps = rows
      .map((r) => ({
        id: r.id,
        name: String(r[cfg.labelField] ?? "") || `#${r.id}`,
        missing: missingForRow(r, cfg.fields, targets),
      }))
      .filter((r) => r.missing.length > 0);
    result.push({ table: cfg.table, label: cfg.label, gaps, total: rows.length });
  }
  return result;
}

export type BackfillResult = { translated: number; errors: string[] };

/**
 * Fills every missing target locale of every translatable table via
 * LibreTranslate. Only gaps are translated — existing (human or machine)
 * values are never overwritten. Tolerant by design: failures are collected
 * per table/locale and everything that succeeded is still persisted.
 */
export async function backfillMissingTranslations(
  supabase: Client,
  targets: readonly Locale[],
): Promise<BackfillResult> {
  let translated = 0;
  const errors: string[] = [];
  const goals = targets.filter((l) => l !== SOURCE_LOCALE);

  for (const cfg of TRANSLATABLE_TABLES) {
    const cols = ["id", ...cfg.fields.flatMap((f) => [`${f}_de`, `${f}_i18n`])];
    const { rows, error } = await selectRows(supabase, cfg.table, cols);
    if (error) {
      errors.push(`${cfg.label}: ${error}`);
      continue;
    }

    // Working copy of each row's i18n maps.
    const maps = new Map<string | number, Record<string, I18nMap>>();
    for (const r of rows) {
      maps.set(
        r.id,
        Object.fromEntries(
          cfg.fields.map((f) => [f, { ...((r[`${f}_i18n`] as I18nMap | null) ?? {}) }]),
        ),
      );
    }
    const dirty = new Set<string | number>();

    for (const target of goals) {
      const pending: { id: string | number; field: string; source: string }[] = [];
      for (const r of rows) {
        for (const f of cfg.fields) {
          const source = r[`${f}_de`];
          if (typeof source === "string" && source.trim() && !maps.get(r.id)![f][target]) {
            pending.push({ id: r.id, field: f, source });
          }
        }
      }

      for (let i = 0; i < pending.length; i += TRANSLATE_CHUNK_SIZE) {
        const chunk = pending.slice(i, i + TRANSLATE_CHUNK_SIZE);
        const { byLocale, ok, error: terr } = await translateBatch(
          chunk.map((p) => p.source),
          SOURCE_LOCALE,
          [target],
        );
        if (!ok) {
          errors.push(`${cfg.label} → ${target}: ${terr ?? "Übersetzung fehlgeschlagen"}`);
          break; // Skip the rest of this target; other targets may still work.
        }
        const out = byLocale[target] ?? [];
        chunk.forEach((p, j) => {
          if (out[j]) {
            maps.get(p.id)![p.field][target] = out[j];
            dirty.add(p.id);
            translated++;
          }
        });
      }
    }

    // DE stays authoritative; persist only rows that gained translations.
    for (const r of rows) {
      if (!dirty.has(r.id)) continue;
      const patch: Record<string, I18nMap> = {};
      for (const f of cfg.fields) {
        const map = maps.get(r.id)![f];
        const source = r[`${f}_de`];
        if (typeof source === "string" && source) map[SOURCE_LOCALE] = source;
        patch[`${f}_i18n`] = map;
      }
      const up = await loose(supabase).from(cfg.table).update(patch).eq("id", r.id);
      if (up.error) errors.push(`${cfg.label} #${r.id}: ${up.error.message}`);
    }
  }

  return { translated, errors };
}
