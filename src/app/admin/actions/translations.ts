"use server";

import { revalidatePath } from "next/cache";
import type { I18nMap } from "@/i18n/fields";
import { backfillMissingTranslations } from "@/i18n/backfill";
import { getEnabledLocales } from "@/i18n/locale-state";
import { backfillMissingUiMessages } from "@/i18n/ui-messages";
import { str } from "@/lib/form-data";
import { routing } from "@/i18n/routing";
import {
  fillTranslations,
  guard,
  revalidatePublic,
  type TranslatableTable,
} from "./shared";

export type TranslateAllState = { ok?: boolean; error?: string; translated?: number };

/**
 * "Fehlende Übersetzungen erstellen": fills every untranslated enabled locale
 * of every content table, plus any enabled locale still missing its admin/site
 * UI texts, via LibreTranslate. Only gaps — existing values are kept. Safe to
 * re-run: it's how a previously failed UI-text translation gets retried.
 */
export async function translateAllMissing(
  _prev: TranslateAllState,
  _fd: FormData,
): Promise<TranslateAllState> {
  try {
    const supabase = await guard();
    const targets = await getEnabledLocales();
    const ui = await backfillMissingUiMessages(supabase, targets);
    const { translated, errors } = await backfillMissingTranslations(supabase, targets);
    const allErrors = [...ui.errors, ...errors];
    if (translated > 0 || ui.translated.length > 0) {
      revalidatePublic();
      revalidatePath("/admin", "layout");
    }
    if (allErrors.length) return { translated, error: allErrors.slice(0, 3).join(" · ") };
    return { ok: true, translated };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export type LocalesState = { ok?: boolean; error?: string; info?: string };

const MIGRATION_HINT =
  "Wurde die SQL-Migration ausgeführt? (supabase/migrations/20260712_dynamic_locales.sql)";

/**
 * Saves the set of active languages, then backfills gaps for every enabled
 * locale — its admin/site UI texts and its content — via LibreTranslate.
 * Running this against the full enabled set (not just newly-added locales)
 * makes it self-healing: re-saving retries any locale whose translation
 * failed last time, since existing entries are never overwritten.
 */
export async function updateEnabledLocales(
  _prev: LocalesState,
  fd: FormData,
): Promise<LocalesState> {
  try {
    const supabase = await guard();
    const selected = new Set(fd.getAll("locales").map(String));
    selected.add(routing.defaultLocale);
    const enabled = routing.locales.filter((l) => selected.has(l));

    const up = await supabase
      .from("restaurant_settings")
      .update({ enabled_locales: enabled })
      .eq("id", 1);
    if (up.error) return { error: `${up.error.message} — ${MIGRATION_HINT}` };

    const problems: string[] = [];
    const ui = await backfillMissingUiMessages(supabase, enabled);
    problems.push(...ui.errors);
    const { translated, errors } = await backfillMissingTranslations(supabase, enabled);
    problems.push(...errors);

    revalidatePublic();
    revalidatePath("/admin", "layout");

    const info = `${translated} Übersetzungen erstellt`;
    if (problems.length) return { info, error: problems.slice(0, 3).join(" · ") };
    return { ok: true, info };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const RETRANSLATE_FIELDS: Record<string, { table: TranslatableTable; fields: string[] }> = {
  item: { table: "menu_items", fields: ["name", "description"] },
  category: { table: "menu_categories", fields: ["name", "description"] },
  page: { table: "pages", fields: ["title", "content"] },
  settings: { table: "restaurant_settings", fields: ["description"] },
};

/** "Alle neu übersetzen": regenerates every non-DE locale from DE. */
export async function retranslate(fd: FormData) {
  const supabase = await guard();
  const cfg = RETRANSLATE_FIELDS[str(fd, "kind")];
  if (!cfg) return;
  const id: string | number = cfg.table === "restaurant_settings" ? 1 : str(fd, "id");

  const cols = cfg.fields.flatMap((f) => [`${f}_de`, `${f}_i18n`]).join(", ");
  const { data } = await supabase
    .from(cfg.table)
    .select(cols)
    .eq("id", id as never)
    .single();
  if (!data) return;
  const row = data as unknown as Record<string, unknown>;

  const fields: Record<string, { i18n: I18nMap; source: string }> = {};
  for (const f of cfg.fields) {
    fields[f] = {
      i18n: (row[`${f}_i18n`] ?? {}) as I18nMap,
      source: String(row[`${f}_de`] ?? ""),
    };
  }
  await fillTranslations(supabase, cfg.table, id, fields, true);
  revalidatePublic();
  revalidatePath("/admin", "layout");
}
