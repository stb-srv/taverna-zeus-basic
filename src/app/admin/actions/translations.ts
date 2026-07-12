"use server";

import { revalidatePath } from "next/cache";
import type { I18nMap } from "@/lib/i18n-fields";
import { backfillMissingTranslations } from "@/lib/i18n-backfill";
import { getEnabledLocales } from "@/lib/locales";
import { translateUiMessages } from "@/lib/ui-messages";
import { str } from "@/lib/form-data";
import { DEFAULT_ENABLED_LOCALES, routing, type Locale } from "@/i18n/routing";
import {
  fillTranslations,
  guard,
  revalidatePublic,
  type TranslatableTable,
} from "./shared";

export type TranslateAllState = { ok?: boolean; error?: string; translated?: number };

/**
 * "Fehlende Übersetzungen erstellen": fills every untranslated enabled locale
 * of every content table via LibreTranslate. Only gaps — existing values are kept.
 */
export async function translateAllMissing(
  _prev: TranslateAllState,
  _fd: FormData,
): Promise<TranslateAllState> {
  try {
    const supabase = await guard();
    const targets = await getEnabledLocales();
    const { translated, errors } = await backfillMissingTranslations(supabase, targets);
    if (translated > 0) {
      revalidatePublic();
      revalidatePath("/admin", "layout");
    }
    if (errors.length) return { translated, error: errors.slice(0, 3).join(" · ") };
    return { ok: true, translated };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export type LocalesState = { ok?: boolean; error?: string; info?: string };

const MIGRATION_HINT =
  "Wurde die SQL-Migration ausgeführt? (supabase/migrations/20260712_dynamic_locales.sql)";

/**
 * Saves the set of active languages. Newly enabled locales get their UI texts
 * machine-translated via LibreTranslate (stored in the DB) and their content
 * gaps backfilled immediately; disabling keeps all translations for later.
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

    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("enabled_locales, ui_messages")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { error: `${error.message} — ${MIGRATION_HINT}` };

    const current = Array.isArray(data?.enabled_locales)
      ? (data.enabled_locales as string[])
      : [...DEFAULT_ENABLED_LOCALES];
    const uiMessages = (
      data?.ui_messages && typeof data.ui_messages === "object" ? data.ui_messages : {}
    ) as Record<string, unknown>;
    const added = enabled.filter((l) => !current.includes(l));
    const problems: string[] = [];

    // UI texts for newly enabled locales without a bundled messages file.
    for (const loc of added) {
      if ((DEFAULT_ENABLED_LOCALES as readonly Locale[]).includes(loc) || uiMessages[loc]) continue;
      const { messages, error: terr } = await translateUiMessages(loc);
      if (terr) problems.push(`UI-Texte ${loc}: ${terr}`);
      if (Object.keys(messages).length > 0) uiMessages[loc] = messages;
    }

    const up = await supabase
      .from("restaurant_settings")
      .update({ enabled_locales: enabled, ui_messages: uiMessages as never })
      .eq("id", 1);
    if (up.error) return { error: `${up.error.message} — ${MIGRATION_HINT}` };

    // Content translations for the new locales (fills gaps only).
    let translated = 0;
    if (added.length > 0) {
      const res = await backfillMissingTranslations(supabase, enabled);
      translated = res.translated;
      problems.push(...res.errors);
    }

    revalidatePublic();
    revalidatePath("/admin", "layout");

    const info = added.length
      ? `${added.length} ${added.length === 1 ? "Sprache" : "Sprachen"} aktiviert, ${translated} Übersetzungen erstellt`
      : "Gespeichert";
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

/** "Alle neu übersetzen": regenerates el/ru/pl/nl/ar/es from DE (DE/EN kept). */
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
