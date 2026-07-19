import { rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal chainable Supabase query stub: every builder method (`select`,
 * `eq`, `order`, ...) returns the same object, and it resolves via `.then`
 * (list queries) or `.maybeSingle()` (singleton queries) to a preset result
 * — covers every shape queries.ts uses without reimplementing postgrest-js.
 */
function makeQuery(result: { data: unknown; error: unknown }) {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    maybeSingle: () => Promise.resolve(result),
    then: (onfulfilled: (r: typeof result) => unknown) => Promise.resolve(result).then(onfulfilled),
  };
  return query;
}

let nextResult: { data: unknown; error: unknown };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => makeQuery(nextResult)),
  })),
}));

const CACHE_DIR = path.join(process.cwd(), ".cache", "queries");

beforeEach(() => {
  vi.resetModules();
});

afterEach(async () => {
  await rm(CACHE_DIR, { recursive: true, force: true });
});

describe("queries — Supabase-outage fallback", () => {
  it("returns fresh data and caches it on a successful read", async () => {
    const { getSettings } = await import("@/lib/queries");
    nextResult = { data: { id: 1, name: "Taverna Zeus" }, error: null };
    expect(await getSettings()).toEqual({ id: 1, name: "Taverna Zeus" });
  });

  it("falls back to the last cached snapshot when Supabase errors", async () => {
    const { getSettings } = await import("@/lib/queries");
    nextResult = { data: { id: 1, name: "Taverna Zeus" }, error: null };
    await getSettings(); // populates the cache

    nextResult = { data: null, error: { message: "connection refused" } };
    expect(await getSettings()).toEqual({ id: 1, name: "Taverna Zeus" });
  });

  it("returns null when Supabase errors and nothing was ever cached", async () => {
    const { getSettings } = await import("@/lib/queries");
    nextResult = { data: null, error: { message: "connection refused" } };
    expect(await getSettings()).toBeNull();
  });

  it("falls back to an empty list (not a crash) for list queries with no cache", async () => {
    const { getOpeningHours } = await import("@/lib/queries");
    nextResult = { data: null, error: { message: "connection refused" } };
    expect(await getOpeningHours()).toEqual([]);
  });

  it("falls back to the cached list on a later outage", async () => {
    const { getOpeningHours } = await import("@/lib/queries");
    const hours = [{ id: "1", day_of_week: 1, sort_order: 0 }];
    nextResult = { data: hours, error: null };
    await getOpeningHours();

    nextResult = { data: null, error: { message: "down" } };
    expect(await getOpeningHours()).toEqual(hours);
  });
});
