import { beforeEach, describe, expect, it, vi } from "vitest";
import { autofillI18n, i18nFromForm } from "@/i18n/fields";
import { translateBatch } from "@/i18n/translate";
import type { Locale } from "@/i18n/routing";

vi.mock("@/i18n/translate", () => ({ translateBatch: vi.fn() }));

const translateMock = vi.mocked(translateBatch);

/** The default enabled set — what actions pass as targets. */
const ENABLED: readonly Locale[] = ["de", "en", "el", "ru", "pl", "nl", "ar", "es"];
const MACHINE: readonly Locale[] = ["el", "ru", "pl", "nl", "ar", "es"];

/** Fake translator: prefixes the text with the target locale, e.g. "el:Gyros". */
function fakeTranslator() {
  translateMock.mockImplementation(async (texts, _source, targets) => ({
    byLocale: Object.fromEntries(targets.map((t) => [t, texts.map((x) => `${t}:${x}`)])),
    ok: true,
  }));
}

beforeEach(() => {
  translateMock.mockReset();
});

describe("i18nFromForm", () => {
  it("collects non-empty per-locale values", () => {
    const data: Record<string, string> = { name_de: "Gyros", name_en: " Gyros EN ", name_el: "" };
    const map = i18nFromForm((k) => data[k] ?? "", "name");
    expect(map).toEqual({ de: "Gyros", en: "Gyros EN" });
  });
});

describe("autofillI18n", () => {
  it("fills empty target locales and keeps the DE source authoritative", async () => {
    fakeTranslator();
    const { result, ok } = await autofillI18n(
      { name: { i18n: { en: "Starters" }, source: "Vorspeisen" } },
      { targets: ENABLED },
    );

    expect(ok).toBe(true);
    // Existing non-empty values are never touched during a normal (non-overwrite) fill.
    expect(result.name.en).toBe("Starters");
    // DE mirrors the source.
    expect(result.name.de).toBe("Vorspeisen");
    // Machine locales are generated from the DE source.
    for (const target of MACHINE) {
      expect(result.name[target]).toBe(`${target}:Vorspeisen`);
    }
  });

  it("only translates into the given targets", async () => {
    fakeTranslator();
    const { result } = await autofillI18n(
      { name: { i18n: {}, source: "Vorspeisen" } },
      { targets: ["de", "en", "el"] },
    );
    expect(result.name.el).toBe("el:Vorspeisen");
    expect(result.name.ru).toBeUndefined();
  });

  it("does not overwrite existing values by default", async () => {
    fakeTranslator();
    const { result } = await autofillI18n(
      { name: { i18n: { el: "Ορεκτικά" }, source: "Vorspeisen" } },
      { targets: ENABLED },
    );
    expect(result.name.el).toBe("Ορεκτικά");
  });

  it("regenerates every machine locale (including EN) with overwrite: true, keeping only DE", async () => {
    fakeTranslator();
    const { result } = await autofillI18n(
      { name: { i18n: { en: "Starters", el: "Ορεκτικά (alt)" }, source: "Vorspeisen" } },
      { targets: ENABLED, overwrite: true },
    );
    expect(result.name.en).toBe("en:Vorspeisen");
    expect(result.name.el).toBe("el:Vorspeisen");
    expect(result.name.de).toBe("Vorspeisen");
  });

  it("is non-fatal on translation failure: existing values survive, ok is false", async () => {
    translateMock.mockResolvedValue({ byLocale: {}, ok: false, error: "LibreTranslate down" });
    const { result, ok, error } = await autofillI18n(
      { name: { i18n: { en: "Starters" }, source: "Vorspeisen" } },
      { targets: ENABLED },
    );
    expect(ok).toBe(false);
    expect(error).toBe("LibreTranslate down");
    expect(result.name.en).toBe("Starters");
    expect(result.name.de).toBe("Vorspeisen");
  });

  it("skips fields without a source", async () => {
    fakeTranslator();
    const { result } = await autofillI18n(
      { name: { i18n: {}, source: "" } },
      { targets: ENABLED },
    );
    expect(result.name).toEqual({});
    expect(translateMock).not.toHaveBeenCalled();
  });
});
