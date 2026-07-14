import { describe, expect, it } from "vitest";
import { imageFileName, resolveParentIds } from "@/lib/menu-transfer";

describe("imageFileName", () => {
  it("extracts the file name from a storage URL", () => {
    expect(imageFileName("https://x.supabase.co/storage/v1/menu/gyros.jpg", new Set())).toBe(
      "gyros.jpg",
    );
  });

  it("strips query strings", () => {
    expect(imageFileName("https://x/img/gyros.jpg?width=200", new Set())).toBe("gyros.jpg");
  });

  it("appends .jpg when there is no extension", () => {
    expect(imageFileName("https://x/img/photo", new Set())).toBe("photo.jpg");
  });

  it("falls back to a default name for empty paths", () => {
    expect(imageFileName("https://x/", new Set())).toBe("bild.jpg");
  });

  it("dedupes repeated names with numeric suffixes", () => {
    const taken = new Set<string>();
    expect(imageFileName("https://x/gyros.jpg", taken)).toBe("gyros.jpg");
    expect(imageFileName("https://y/gyros.jpg", taken)).toBe("gyros-1.jpg");
    expect(imageFileName("https://z/gyros.jpg", taken)).toBe("gyros-2.jpg");
  });

  it("handles root-relative paths", () => {
    expect(imageFileName("/uploads/souvlaki.png", new Set())).toBe("souvlaki.png");
  });
});

describe("resolveParentIds", () => {
  it("resolves a parent listed before its child", () => {
    const idBySlug = new Map([
      ["hauptspeisen", "id-1"],
      ["pasta", "id-2"],
    ]);
    const result = resolveParentIds(
      [
        { slug: "hauptspeisen", parent_slug: null },
        { slug: "pasta", parent_slug: "hauptspeisen" },
      ],
      idBySlug,
    );
    expect(result.get("id-2")).toBe("id-1");
    expect(result.size).toBe(1);
  });

  it("resolves a child listed before its parent (order independent)", () => {
    const idBySlug = new Map([
      ["pasta", "id-2"],
      ["hauptspeisen", "id-1"],
    ]);
    const result = resolveParentIds(
      [
        { slug: "pasta", parent_slug: "hauptspeisen" },
        { slug: "hauptspeisen", parent_slug: null },
      ],
      idBySlug,
    );
    expect(result.get("id-2")).toBe("id-1");
    expect(result.size).toBe(1);
  });

  it("drops the deepest link of a 3-level chain in source data", () => {
    const idBySlug = new Map([
      ["hauptspeisen", "id-1"],
      ["pasta", "id-2"],
      ["carbonara", "id-3"],
    ]);
    const result = resolveParentIds(
      [
        { slug: "hauptspeisen", parent_slug: null },
        { slug: "pasta", parent_slug: "hauptspeisen" },
        { slug: "carbonara", parent_slug: "pasta" },
      ],
      idBySlug,
    );
    expect(result.get("id-2")).toBe("id-1");
    expect(result.has("id-3")).toBe(false);
    expect(result.size).toBe(1);
  });

  it("ignores a parent_slug pointing to a non-existent slug", () => {
    const idBySlug = new Map([["pasta", "id-2"]]);
    const result = resolveParentIds(
      [{ slug: "pasta", parent_slug: "does-not-exist" }],
      idBySlug,
    );
    expect(result.size).toBe(0);
  });

  it("ignores a self-referencing parent_slug", () => {
    const idBySlug = new Map([["pasta", "id-2"]]);
    const result = resolveParentIds(
      [{ slug: "pasta", parent_slug: "pasta" }],
      idBySlug,
    );
    expect(result.size).toBe(0);
  });
});
