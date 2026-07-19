import { defineRouting } from "next-intl/routing";

/**
 * Superset of every locale the app can serve — the router needs this list at
 * build time. Which locales are actually ACTIVE is stored in the DB
 * (`restaurant_settings.enabled_locales`) and managed under
 * /admin/translations; enabling a locale machine-translates UI texts and
 * content via LibreTranslate. Every entry here must be a language the
 * LibreTranslate instance supports.
 */
export const routing = defineRouting({
  // Order drives the language switcher. de = authoritative source for translations.
  locales: [
    "de", "en", "el", "ru", "pl", "nl", "ar", "es",
    "fr", "it", "tr", "pt", "cs", "da", "sv", "uk", "ro", "hu", "zh", "ja",
  ],
  defaultLocale: "de",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

/**
 * Enabled out of the box, and the fallback set `getEnabledLocales()` returns
 * if `restaurant_settings` itself is unreachable — only German ("de") is
 * bundled as a static file; every locale's UI text (including these) lives
 * in the DB, machine-translated via LibreTranslate and mirrored to an
 * on-disk cache (see ui-messages-cache.ts) for when Supabase is down.
 */
export const DEFAULT_ENABLED_LOCALES: readonly Locale[] = [
  "de", "en", "el", "ru", "pl", "nl", "ar", "es",
];

/** Locales that render right-to-left. */
export const rtlLocales: readonly Locale[] = ["ar"];

/** Human-readable, self-referencing names for the language switcher. */
export const localeNames: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  el: "Ελληνικά",
  ru: "Русский",
  pl: "Polski",
  nl: "Nederlands",
  ar: "العربية",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  tr: "Türkçe",
  pt: "Português",
  cs: "Čeština",
  da: "Dansk",
  sv: "Svenska",
  uk: "Українська",
  ro: "Română",
  hu: "Magyar",
  zh: "中文",
  ja: "日本語",
};
