import { describe, expect, it } from "vitest";
import { missingForRow, missingLocales, TRANSLATABLE_TABLES } from "@/i18n/translation-status";
import type { Locale } from "@/i18n/routing";

/** Enabled locales as passed by the callers (incl. the DE source). */
const ENABLED: readonly Locale[] = ["de", "en", "el", "ru", "pl", "nl", "ar", "es"];
/** What can actually be missing: everything except the DE source. */
const TARGETS = ENABLED.filter((l) => l !== "de");

function fullMap(): Record<string, string> {
  return Object.fromEntries(TARGETS.map((l) => [l, `x-${l}`]));
}

describe("missingLocales", () => {
  it("returns nothing when there is no source text", () => {
    expect(missingLocales({}, null, ENABLED)).toEqual([]);
    expect(missingLocales({}, "", ENABLED)).toEqual([]);
    expect(missingLocales({}, "   ", ENABLED)).toEqual([]);
  });

  it("returns all targets when nothing is translated", () => {
    expect(missingLocales(null, "Gyros", ENABLED)).toEqual(TARGETS);
    expect(missingLocales({}, "Gyros", ENABLED)).toEqual(TARGETS);
  });

  it("never reports the DE source as missing", () => {
    expect(missingLocales({}, "Gyros", ["de", "en"])).toEqual(["en"]);
  });

  it("returns only the untranslated locales", () => {
    const i18n = fullMap();
    delete i18n.el;
    delete i18n.ar;
    expect(missingLocales(i18n, "Gyros", ENABLED)).toEqual(["el", "ar"]);
  });

  it("returns nothing when every target is translated", () => {
    expect(missingLocales(fullMap(), "Gyros", ENABLED)).toEqual([]);
  });

  it("treats whitespace-only values as missing", () => {
    const i18n = fullMap();
    i18n.pl = "   ";
    expect(missingLocales(i18n, "Gyros", ENABLED)).toEqual(["pl"]);
  });

  it("ignores a malformed i18n column", () => {
    expect(missingLocales("kaputt", "Gyros", ENABLED)).toEqual(TARGETS);
  });
});

describe("missingForRow", () => {
  it("merges the gaps of all fields, ordered like the locale list", () => {
    const row = {
      name_de: "Gyros",
      name_i18n: { ...fullMap(), el: "" },
      description_de: "Mit Tzatziki",
      description_i18n: { ...fullMap(), en: "", el: "" },
    };
    expect(missingForRow(row, ["name", "description"], ENABLED)).toEqual(["en", "el"]);
  });

  it("ignores fields without a DE source", () => {
    const row = { name_de: "", name_i18n: {}, description_de: null, description_i18n: null };
    expect(missingForRow(row, ["name", "description"], ENABLED)).toEqual([]);
  });
});

describe("TRANSLATABLE_TABLES", () => {
  it("covers all content tables with i18n columns", () => {
    expect(TRANSLATABLE_TABLES.map((t) => t.table)).toEqual([
      "menu_items",
      "menu_categories",
      "pages",
      "restaurant_settings",
      "allergens",
      "additives",
    ]);
  });
});
