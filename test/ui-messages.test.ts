import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  flattenMessages,
  mergeMessages,
  translateUiMessages,
  type MessageTree,
} from "@/lib/ui-messages";
import { translateBatch } from "@/lib/translate";

vi.mock("@/lib/translate", () => ({ translateBatch: vi.fn() }));

const translateMock = vi.mocked(translateBatch);

beforeEach(() => {
  translateMock.mockReset();
});

describe("flattenMessages", () => {
  it("flattens nested trees into dotted paths", () => {
    const tree: MessageTree = { nav: { home: "Start", sub: { a: "A" } }, top: "T" };
    expect(flattenMessages(tree)).toEqual([
      ["nav.home", "Start"],
      ["nav.sub.a", "A"],
      ["top", "T"],
    ]);
  });
});

describe("mergeMessages", () => {
  it("overlays translated values and falls back to the base for gaps", () => {
    const base: MessageTree = { nav: { home: "Startseite", menu: "Speisekarte" }, x: "X" };
    const merged = mergeMessages(base, { nav: { home: "Accueil", menu: "" } });
    expect(merged).toEqual({ nav: { home: "Accueil", menu: "Speisekarte" }, x: "X" });
  });

  it("ignores overlay keys that do not exist in the base", () => {
    const merged = mergeMessages({ a: "A" }, { a: "B", ghost: "?" });
    expect(merged).toEqual({ a: "B" });
  });
});

describe("translateUiMessages", () => {
  it("translates the German UI strings but skips ICU strings", async () => {
    translateMock.mockImplementation(async (texts, _source, targets) => ({
      byLocale: Object.fromEntries(targets.map((t) => [t, texts.map((x) => `${t}:${x}`)])),
      ok: true,
    }));

    const { messages, error } = await translateUiMessages("fr");

    expect(error).toBeUndefined();
    // Regular strings are translated …
    const nav = messages.nav as MessageTree;
    expect(nav.home).toBe("fr:Startseite");
    // … but the ICU plural string was never sent to the translator.
    const sent = translateMock.mock.calls.flatMap(([texts]) => texts);
    expect(sent.some((t) => t.includes("{"))).toBe(false);
    const menu = (messages.menu ?? {}) as MessageTree;
    expect(menu.resultCount).toBeUndefined();
  });

  it("reports failures and returns what was translated so far", async () => {
    translateMock.mockResolvedValue({ byLocale: {}, ok: false, error: "down" });
    const { error } = await translateUiMessages("fr");
    expect(error).toBe("down");
  });
});
