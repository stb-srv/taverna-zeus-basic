import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ENABLED_LOCALES, type Locale } from "@/i18n/routing";
import type { Database } from "@/lib/supabase/types";
import { translateBatch, TRANSLATE_CHUNK_SIZE } from "./translate";
import { SOURCE_LOCALE } from "./fields";
import deMessages from "../../messages/de.json";

export type MessageTree = { [key: string]: string | MessageTree };

/** Flattens a nested message tree into [dotted path, value] pairs. */
export function flattenMessages(tree: MessageTree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value] as [string, string]]
      : flattenMessages(value, `${prefix}${key}.`),
  );
}

function setPath(target: MessageTree, path: string, value: string): void {
  const keys = path.split(".");
  let node = target;
  for (const key of keys.slice(0, -1)) {
    const next = node[key];
    node = typeof next === "object" && next !== null ? next : (node[key] = {});
  }
  node[keys[keys.length - 1]] = value;
}

function getPath(tree: unknown, path: string): unknown {
  let node = tree;
  for (const key of path.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/** All DE source entries eligible for machine translation (ICU strings with `{…}` are skipped). */
function translatableEntries(): [string, string][] {
  return flattenMessages(deMessages as MessageTree).filter(([, v]) => !v.includes("{"));
}

/** Dotted paths still missing (or blank) from an existing per-locale message tree. */
export function missingUiKeys(existing: unknown): string[] {
  return translatableEntries()
    .filter(([path]) => {
      const cur = getPath(existing, path);
      return !(typeof cur === "string" && cur.trim());
    })
    .map(([path]) => path);
}

/**
 * Deep-merges an overlay (bundled or machine-translated messages) over the
 * German base so every missing key still renders in German.
 */
export function mergeMessages(base: MessageTree, overlay: Record<string, unknown>): MessageTree {
  const result: MessageTree = {};
  for (const [key, baseValue] of Object.entries(base)) {
    const over = overlay[key];
    if (typeof baseValue === "string") {
      result[key] = typeof over === "string" && over.trim() ? over : baseValue;
    } else {
      result[key] = mergeMessages(
        baseValue,
        over && typeof over === "object" ? (over as Record<string, unknown>) : {},
      );
    }
  }
  return result;
}

/**
 * Machine-translates the German UI strings for a locale via LibreTranslate,
 * filling only keys still missing from `existing` (never re-translates or
 * overwrites what's already there). ICU strings (containing `{…}`) are
 * skipped — broken plural syntax would crash the renderer, so those fall
 * back to German instead. Tolerant per chunk: a single failed chunk (e.g. a
 * transient LibreTranslate/proxy hiccup) is recorded but doesn't abort the
 * remaining chunks — otherwise one bad chunk partway through a large
 * namespace like `admin` would silently strand everything after it.
 */
export async function translateUiMessages(
  target: Locale,
  existing: unknown = {},
): Promise<{ messages: MessageTree; error?: string }> {
  const out: MessageTree =
    existing && typeof existing === "object"
      ? (structuredClone(existing) as MessageTree)
      : {};
  const entries = translatableEntries().filter(([path]) => {
    const cur = getPath(existing, path);
    return !(typeof cur === "string" && cur.trim());
  });

  let error: string | undefined;
  for (let i = 0; i < entries.length; i += TRANSLATE_CHUNK_SIZE) {
    const chunk = entries.slice(i, i + TRANSLATE_CHUNK_SIZE);
    const { byLocale, ok, error: terr } = await translateBatch(
      chunk.map(([, v]) => v),
      SOURCE_LOCALE,
      [target],
    );
    if (!ok) {
      error = terr;
      continue;
    }
    const translated = byLocale[target] ?? [];
    chunk.forEach(([path], j) => {
      if (translated[j]) setPath(out, path, translated[j]);
    });
  }
  return { messages: out, error };
}

/** Enabled locales beyond the bundled set that are still missing any UI text. */
export function missingUiLocales(uiMessages: unknown, targets: readonly Locale[]): Locale[] {
  const map = (uiMessages && typeof uiMessages === "object" ? uiMessages : {}) as Record<
    string,
    unknown
  >;
  return targets.filter(
    (l) =>
      !(DEFAULT_ENABLED_LOCALES as readonly Locale[]).includes(l) &&
      missingUiKeys(map[l]).length > 0,
  );
}

export type UiBackfillResult = { translated: Locale[]; errors: string[] };

/**
 * Fills `ui_messages` for every enabled locale beyond the bundled default
 * set that's still missing any key — same idea as `backfillMissingTranslations`
 * for content, but for the admin/site UI strings themselves, and gap-filled at
 * the individual key level so a locale that got partially translated last
 * time (e.g. a namespace stranded by a proxy timeout) picks up exactly where
 * it left off. Persists after each locale rather than once at the end, so a
 * timeout partway through a multi-locale run doesn't lose earlier progress.
 */
export async function backfillMissingUiMessages(
  supabase: SupabaseClient<Database>,
  targets: readonly Locale[],
): Promise<UiBackfillResult> {
  const translated: Locale[] = [];
  const errors: string[] = [];

  const goals = targets.filter((l) => !(DEFAULT_ENABLED_LOCALES as readonly Locale[]).includes(l));
  if (goals.length === 0) return { translated, errors };

  for (const loc of goals) {
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("ui_messages")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      errors.push(error.message);
      continue;
    }
    const uiMessages = (
      data?.ui_messages && typeof data.ui_messages === "object" ? data.ui_messages : {}
    ) as Record<string, unknown>;
    const existing = uiMessages[loc];
    if (missingUiKeys(existing).length === 0) continue;

    const { messages, error: terr } = await translateUiMessages(loc, existing);
    if (terr) errors.push(`UI-Texte ${loc}: ${terr}`);
    uiMessages[loc] = messages;

    const up = await supabase
      .from("restaurant_settings")
      .update({ ui_messages: uiMessages as never })
      .eq("id", 1);
    if (up.error) {
      errors.push(up.error.message);
      continue;
    }
    translated.push(loc);
  }

  return { translated, errors };
}
