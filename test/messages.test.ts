import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";

const messagesDir = new URL("../messages/", import.meta.url);

function loadMessages(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`${locale}.json`, messagesDir)), "utf8"));
}

/** Flattens nested message objects into dotted key paths. */
function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === "object"
      ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

describe("messages", () => {
  const reference = keyPaths(loadMessages(routing.defaultLocale)).sort();

  it("has a messages file for every configured locale", () => {
    for (const locale of routing.locales) {
      expect(() => loadMessages(locale), `messages/${locale}.json`).not.toThrow();
    }
  });

  for (const locale of routing.locales) {
    it(`messages/${locale}.json has exactly the same keys as ${routing.defaultLocale}.json`, () => {
      expect(keyPaths(loadMessages(locale)).sort()).toEqual(reference);
    });
  }

  it("has no empty message values in any locale", () => {
    for (const locale of routing.locales) {
      const messages = loadMessages(locale);
      const empty = keyPaths(messages).filter((path) => {
        const value = path
          .split(".")
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages);
        return typeof value === "string" && value.trim() === "";
      });
      expect(empty, `empty values in messages/${locale}.json`).toEqual([]);
    }
  });
});
