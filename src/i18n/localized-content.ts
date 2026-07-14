import { routing, type Locale } from "@/i18n/routing";

/**
 * Picks the value for the active locale. Prefers the per-field `<field>_i18n`
 * JSONB map (`{ de, en, el, … }`), falling back to the default locale within it,
 * then to the legacy `<field>_de`/`<field>_en` columns.
 */
export function localized<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: Locale,
): string {
  const i18n = row[`${field}_i18n`];
  if (i18n && typeof i18n === "object") {
    const map = i18n as Record<string, unknown>;
    const v = map[locale] ?? map[routing.defaultLocale];
    if (typeof v === "string" && v) return v;
  }
  const legacy = row[`${field}_${locale}`] ?? row[`${field}_de`];
  return typeof legacy === "string" ? legacy : "";
}

/** BCP-47 tag per locale for number/date formatting. */
const priceLocale: Record<Locale, string> = {
  de: "de-DE",
  en: "en-GB",
  el: "el-GR",
  ru: "ru-RU",
  pl: "pl-PL",
  nl: "nl-NL",
  ar: "ar",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  tr: "tr-TR",
  pt: "pt-PT",
  cs: "cs-CZ",
  da: "da-DK",
  sv: "sv-SE",
  uk: "uk-UA",
  ro: "ro-RO",
  hu: "hu-HU",
  zh: "zh-CN",
  ja: "ja-JP",
};

/** Formats a numeric price as a localized currency string (EUR). */
export function formatPrice(price: number | null, locale: Locale): string {
  if (price === null) return "";
  return new Intl.NumberFormat(priceLocale[locale] ?? "de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

/** Trims a Postgres `time` value ("11:30:00") to "11:30". */
export function formatTime(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}
