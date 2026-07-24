import { describe, expect, it } from "vitest";
import { publicReviewName } from "@/lib/review-name";

describe("publicReviewName", () => {
  it("combines first name with the last-name initial", () => {
    expect(publicReviewName("Steven", "Behncke")).toBe("Steven B.");
  });

  it("returns only the first name when no last name is given", () => {
    expect(publicReviewName("Steven", null)).toBe("Steven");
  });

  it("treats a blank last name like a missing one", () => {
    expect(publicReviewName("Steven", "   ")).toBe("Steven");
  });

  it("trims surrounding whitespace from both parts", () => {
    expect(publicReviewName("  Steven ", " Behncke ")).toBe("Steven B.");
  });

  it("keeps non-ASCII initials intact", () => {
    expect(publicReviewName("Aylin", "Özdemir")).toBe("Aylin Ö.");
  });

  it("uses the first character of a multi-word last name", () => {
    expect(publicReviewName("Maria", "van der Berg")).toBe("Maria v.");
  });
});
