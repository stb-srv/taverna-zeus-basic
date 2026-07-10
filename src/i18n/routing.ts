import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Order drives the language switcher. de = authoritative source for translations.
  locales: ["de", "en", "el", "ru", "pl", "nl", "ar", "es"],
  defaultLocale: "de",
  localePrefix: "always",
});

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
};

export type Locale = (typeof routing.locales)[number];
