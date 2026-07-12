import "server-only";

import { cache } from "react";
import { createClient } from "./supabase/server";
import { DEFAULT_ENABLED_LOCALES, routing, type Locale } from "@/i18n/routing";

/**
 * Active locales from the DB, in the order of `routing.locales`. Falls back to
 * the bundled default set when the column is missing (migration not yet run)
 * or empty. The default locale is always included. Cached per request.
 */
export const getEnabledLocales = cache(async (): Promise<Locale[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("enabled_locales")
      .eq("id", 1)
      .maybeSingle();
    if (!error && Array.isArray(data?.enabled_locales)) {
      const raw = data.enabled_locales as string[];
      const valid = routing.locales.filter((l) => raw.includes(l));
      if (valid.length > 0) {
        return valid.includes(routing.defaultLocale)
          ? valid
          : [routing.defaultLocale, ...valid];
      }
    }
  } catch {
    // Table or column missing — use the bundled defaults.
  }
  return [...DEFAULT_ENABLED_LOCALES];
});

/**
 * DB-stored, machine-translated UI messages for locales without a bundled
 * `messages/<locale>.json`. Empty object when none exist (callers fall back
 * to the German base). Cached per request.
 */
export const getUiMessages = cache(async (locale: Locale): Promise<Record<string, unknown>> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("ui_messages")
      .eq("id", 1)
      .maybeSingle();
    if (error) return {};
    const all = data?.ui_messages;
    const forLocale =
      all && typeof all === "object" ? (all as Record<string, unknown>)[locale] : null;
    return forLocale && typeof forLocale === "object"
      ? (forLocale as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
});
