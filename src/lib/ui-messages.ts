import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ENABLED_LOCALES, type Locale } from "@/i18n/routing";
import type { Database } from "./supabase/types";
import { translateBatch } from "./translate";
import { SOURCE_LOCALE } from "./i18n-fields";
import deMessages from "../../messages/de.json";

export type MessageTree = { [key: string]: string | MessageTree };

/** Large batches trip proxy timeouts — translate in small chunks. */
const CHUNK = 20;

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
 * Machine-translates the German UI strings for a newly enabled locale via
 * LibreTranslate. ICU strings (containing `{…}`) are skipped — broken plural
 * syntax would crash the renderer, so those fall back to German instead.
 */
export async function translateUiMessages(
  target: Locale,
): Promise<{ messages: MessageTree; error?: string }> {
  const entries = flattenMessages(deMessages as MessageTree).filter(([, v]) => !v.includes("{"));
  const out: MessageTree = {};

  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const { byLocale, ok, error } = await translateBatch(
      chunk.map(([, v]) => v),
      SOURCE_LOCALE,
      [target],
    );
    if (!ok) return { messages: out, error };
    const translated = byLocale[target] ?? [];
    chunk.forEach(([path], j) => {
      if (translated[j]) setPath(out, path, translated[j]);
    });
  }
  return { messages: out };
}

/** Enabled locales beyond the bundled set that still have no `ui_messages` entry. */
export function missingUiLocales(uiMessages: unknown, targets: readonly Locale[]): Locale[] {
  const map = (uiMessages && typeof uiMessages === "object" ? uiMessages : {}) as Record<
    string,
    unknown
  >;
  return targets.filter(
    (l) => !(DEFAULT_ENABLED_LOCALES as readonly Locale[]).includes(l) && !map[l],
  );
}

export type UiBackfillResult = { translated: Locale[]; errors: string[] };

/**
 * Fills `ui_messages` for every enabled locale beyond the bundled default set
 * that doesn't have it yet — same idea as `backfillMissingTranslations` for
 * content, but for the admin/site UI strings themselves. Tolerant by design:
 * a failed locale is reported but doesn't block the others, and callers can
 * re-run this safely since existing entries are never overwritten.
 */
export async function backfillMissingUiMessages(
  supabase: SupabaseClient<Database>,
  targets: readonly Locale[],
): Promise<UiBackfillResult> {
  const translated: Locale[] = [];
  const errors: string[] = [];

  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("ui_messages")
    .eq("id", 1)
    .maybeSingle();
  if (error) return { translated, errors: [error.message] };

  const uiMessages = (
    data?.ui_messages && typeof data.ui_messages === "object" ? data.ui_messages : {}
  ) as Record<string, unknown>;
  const pending = missingUiLocales(uiMessages, targets);
  if (pending.length === 0) return { translated, errors };

  for (const loc of pending) {
    const { messages, error: terr } = await translateUiMessages(loc);
    if (terr) errors.push(`UI-Texte ${loc}: ${terr}`);
    if (Object.keys(messages).length > 0) {
      uiMessages[loc] = messages;
      translated.push(loc);
    }
  }

  if (translated.length > 0) {
    const up = await supabase
      .from("restaurant_settings")
      .update({ ui_messages: uiMessages as never })
      .eq("id", 1);
    if (up.error) errors.push(up.error.message);
  }

  return { translated, errors };
}
