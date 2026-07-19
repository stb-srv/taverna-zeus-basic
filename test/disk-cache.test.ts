import { rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readDiskCache, writeDiskCache } from "@/lib/disk-cache";

const NAMESPACE = "__test-namespace__";
const CACHE_DIR = path.join(process.cwd(), ".cache", NAMESPACE);

afterEach(async () => {
  await rm(CACHE_DIR, { recursive: true, force: true });
});

describe("disk-cache", () => {
  it("returns null for a key that was never cached", async () => {
    expect(await readDiskCache(NAMESPACE, "missing")).toBeNull();
  });

  it("round-trips a snapshot written for a key", async () => {
    const data = { a: 1, b: ["x", "y"] };
    await writeDiskCache(NAMESPACE, "some-key", data);
    expect(await readDiskCache(NAMESPACE, "some-key")).toEqual(data);
  });

  it("overwrites a previous snapshot for the same key", async () => {
    await writeDiskCache(NAMESPACE, "some-key", { v: 1 });
    await writeDiskCache(NAMESPACE, "some-key", { v: 2 });
    expect(await readDiskCache(NAMESPACE, "some-key")).toEqual({ v: 2 });
  });

  it("sanitizes keys containing filesystem-unsafe characters (e.g. ':')", async () => {
    // Real caller: getGalleryImages(`gallery:page:<uuid>`) — ":" is invalid in Windows filenames.
    await writeDiskCache(NAMESPACE, "gallery:page:1234", { images: [] });
    expect(await readDiskCache(NAMESPACE, "gallery:page:1234")).toEqual({ images: [] });
  });

  it("keeps different keys independent", async () => {
    await writeDiskCache(NAMESPACE, "one", { v: 1 });
    await writeDiskCache(NAMESPACE, "two", { v: 2 });
    expect(await readDiskCache(NAMESPACE, "one")).toEqual({ v: 1 });
    expect(await readDiskCache(NAMESPACE, "two")).toEqual({ v: 2 });
  });
});
