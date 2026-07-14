import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ENABLED_LOCALES, routing, type Locale } from "@/i18n/routing";

/** Cookie holding the admin UI's own display language (separate from public site content). */
export const ADMIN_LOCALE_COOKIE = "admin_locale";

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
 * The admin UI's own display locale, from its cookie (set by
 * `AdminLanguageSwitcher`/`setAdminLocale`) — independent of the public
 * site's URL-based content locale. Falls back to German. Used both by the
 * admin root layout (to load messages) and by server actions that need to
 * translate a returned error message.
 */
export async function getAdminLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieLocale = store.get(ADMIN_LOCALE_COOKIE)?.value as Locale | undefined;
  const enabled = await getEnabledLocales();
  if (cookieLocale && routing.locales.includes(cookieLocale) && enabled.includes(cookieLocale)) {
    return cookieLocale;
  }
  return routing.defaultLocale;
}

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
