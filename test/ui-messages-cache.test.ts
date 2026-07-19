import { rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readMessagesCache, writeMessagesCache } from "@/i18n/ui-messages-cache";
import type { MessageTree } from "@/i18n/ui-messages";

const TEST_LOCALE = "__test-locale__";
const CACHE_DIR = path.join(process.cwd(), ".cache", "ui-messages");

afterEach(async () => {
  await rm(path.join(CACHE_DIR, `${TEST_LOCALE}.json`), { force: true });
});

describe("ui-messages-cache", () => {
  it("returns null for a locale that was never cached", async () => {
    expect(await readMessagesCache(TEST_LOCALE)).toBeNull();
  });

  it("round-trips a snapshot written for a locale", async () => {
    const messages: MessageTree = { nav: { home: "Start" } };
    await writeMessagesCache(TEST_LOCALE, messages);
    expect(await readMessagesCache(TEST_LOCALE)).toEqual(messages);
  });

  it("overwrites a previous snapshot for the same locale", async () => {
    await writeMessagesCache(TEST_LOCALE, { nav: { home: "Alt" } });
    await writeMessagesCache(TEST_LOCALE, { nav: { home: "Neu" } });
    expect(await readMessagesCache(TEST_LOCALE)).toEqual({ nav: { home: "Neu" } });
  });
});
