import { beforeEach, describe, expect, it, vi } from "vitest";
import { autofillI18n, i18nFromForm, MACHINE_TARGETS } from "@/lib/i18n-fields";
import { translateBatch } from "@/lib/translate";

vi.mock("@/lib/translate", () => ({ translateBatch: vi.fn() }));

const translateMock = vi.mocked(translateBatch);

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
    const { result, ok } = await autofillI18n({
      name: { i18n: { en: "Starters" }, source: "Vorspeisen" },
    });

    expect(ok).toBe(true);
    // Human-authored EN stays untouched.
    expect(result.name.en).toBe("Starters");
    // DE mirrors the source.
    expect(result.name.de).toBe("Vorspeisen");
    // Machine locales are generated from the DE source.
    for (const target of MACHINE_TARGETS) {
      expect(result.name[target]).toBe(`${target}:Vorspeisen`);
    }
  });

  it("does not overwrite existing values by default", async () => {
    fakeTranslator();
    const { result } = await autofillI18n({
      name: { i18n: { el: "Ορεκτικά" }, source: "Vorspeisen" },
    });
    expect(result.name.el).toBe("Ορεκτικά");
  });

  it("regenerates machine locales with overwrite: true, keeping EN", async () => {
    fakeTranslator();
    const { result } = await autofillI18n(
      { name: { i18n: { en: "Starters", el: "Ορεκτικά (alt)" }, source: "Vorspeisen" } },
      { overwrite: true },
    );
    expect(result.name.en).toBe("Starters");
    expect(result.name.el).toBe("el:Vorspeisen");
  });

  it("is non-fatal on translation failure: existing values survive, ok is false", async () => {
    translateMock.mockResolvedValue({ byLocale: {}, ok: false, error: "LibreTranslate down" });
    const { result, ok, error } = await autofillI18n({
      name: { i18n: { en: "Starters" }, source: "Vorspeisen" },
    });
    expect(ok).toBe(false);
    expect(error).toBe("LibreTranslate down");
    expect(result.name.en).toBe("Starters");
    expect(result.name.de).toBe("Vorspeisen");
  });

  it("skips fields without a source", async () => {
    fakeTranslator();
    const { result } = await autofillI18n({ name: { i18n: {}, source: "" } });
    expect(result.name).toEqual({});
    expect(translateMock).not.toHaveBeenCalled();
  });
});
