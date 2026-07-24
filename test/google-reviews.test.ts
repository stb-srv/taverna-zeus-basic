import { describe, expect, it } from "vitest";
import { mapGoogleReview } from "@/lib/google-reviews";

describe("mapGoogleReview", () => {
  const base = {
    name: "places/ABC/reviews/XYZ",
    rating: 5,
    originalText: { text: "Sehr gutes Essen!", languageCode: "de" },
    authorAttribution: { displayName: "Maria K." },
    publishTime: "2026-07-01T12:34:56Z",
  };

  it("maps a complete review", () => {
    expect(mapGoogleReview(base)).toEqual({
      external_id: "places/ABC/reviews/XYZ",
      author_name: "Maria K.",
      rating: 5,
      text: "Sehr gutes Essen!",
      review_date: "2026-07-01",
    });
  });

  it("prefers originalText over the Google-translated text", () => {
    const r = mapGoogleReview({
      ...base,
      text: { text: "Very good food!", languageCode: "en" },
    });
    expect(r?.text).toBe("Sehr gutes Essen!");
  });

  it("falls back to text when originalText is absent", () => {
    const r = mapGoogleReview({ ...base, originalText: undefined, text: { text: "Nice" } });
    expect(r?.text).toBe("Nice");
  });

  it("returns null without a stable review name", () => {
    expect(mapGoogleReview({ ...base, name: undefined })).toBeNull();
  });

  it("returns null for an out-of-range or non-integer rating", () => {
    expect(mapGoogleReview({ ...base, rating: 0 })).toBeNull();
    expect(mapGoogleReview({ ...base, rating: 6 })).toBeNull();
    expect(mapGoogleReview({ ...base, rating: 4.5 })).toBeNull();
  });

  it("returns null when the text is empty", () => {
    expect(mapGoogleReview({ ...base, originalText: { text: "   " }, text: undefined })).toBeNull();
  });

  it("uses a placeholder when the author name is missing", () => {
    const r = mapGoogleReview({ ...base, authorAttribution: undefined });
    expect(r?.author_name).toBe("Google-Nutzer");
  });

  it("keeps review_date null without a publish time", () => {
    const r = mapGoogleReview({ ...base, publishTime: undefined });
    expect(r?.review_date).toBeNull();
  });
});
