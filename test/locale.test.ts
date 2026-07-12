import { describe, expect, it } from "vitest";
import { formatPrice, formatTime, localized } from "@/lib/locale";

/** Intl inserts non-breaking spaces; normalize for readable assertions. */
function plain(s: string): string {
  return s.replace(/[  ]/g, " ");
}

describe("localized", () => {
  const row = {
    name_i18n: { de: "Vorspeisen", en: "Starters", el: "Ορεκτικά" },
    name_de: "Vorspeisen (legacy)",
    name_en: "Starters (legacy)",
  };

  it("prefers the i18n map for the active locale", () => {
    expect(localized(row, "name", "el")).toBe("Ορεκτικά");
  });

  it("falls back to the default locale (de) inside the i18n map", () => {
    expect(localized(row, "name", "pl")).toBe("Vorspeisen");
  });

  it("falls back to the legacy columns when there is no i18n map", () => {
    const legacyRow = { name_de: "Salate", name_en: "Salads" };
    expect(localized(legacyRow, "name", "en")).toBe("Salads");
    expect(localized(legacyRow, "name", "ru")).toBe("Salate");
  });

  it("returns '' when nothing is available", () => {
    expect(localized({}, "name", "de")).toBe("");
  });
});

describe("formatPrice", () => {
  it("formats EUR for the German locale", () => {
    expect(plain(formatPrice(12.5, "de"))).toBe("12,50 €");
  });

  it("formats EUR for the English locale", () => {
    expect(plain(formatPrice(12.5, "en"))).toBe("€12.50");
  });

  it("returns '' for null prices", () => {
    expect(formatPrice(null, "de")).toBe("");
  });
});

describe("formatTime", () => {
  it("trims Postgres time values to HH:MM", () => {
    expect(formatTime("11:30:00")).toBe("11:30");
  });

  it("returns '' for null", () => {
    expect(formatTime(null)).toBe("");
  });
});
