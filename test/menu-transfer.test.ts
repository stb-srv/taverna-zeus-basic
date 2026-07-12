import { describe, expect, it } from "vitest";
import { imageFileName } from "@/lib/menu-transfer";

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
