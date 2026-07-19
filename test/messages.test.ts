import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_ENABLED_LOCALES, localeNames, routing } from "@/i18n/routing";

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
  // German is the only bundled locale — every other locale is machine-translated
  // and stored in restaurant_settings.ui_messages (see src/i18n/ui-messages.ts).
  it("has a bundled messages file for the default locale", () => {
    expect(() => loadMessages(routing.defaultLocale)).not.toThrow();
  });

  it("has no empty message values in the bundled locale", () => {
    const messages = loadMessages(routing.defaultLocale);
    const empty = keyPaths(messages).filter((path) => {
      const value = path
        .split(".")
        .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages);
      return typeof value === "string" && value.trim() === "";
    });
    expect(empty, `empty values in messages/${routing.defaultLocale}.json`).toEqual([]);
  });
});

describe("locale configuration", () => {
  it("default-enabled locales are a subset of the routing superset", () => {
    for (const locale of DEFAULT_ENABLED_LOCALES) {
      expect(routing.locales).toContain(locale);
    }
  });

  it("every routable locale has a display name", () => {
    for (const locale of routing.locales) {
      expect(localeNames[locale], `localeNames.${locale}`).toBeTruthy();
    }
  });
});
