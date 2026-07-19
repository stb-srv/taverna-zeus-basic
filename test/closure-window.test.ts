import { describe, expect, it } from "vitest";
import { isWithinClosureWindow } from "@/lib/closure-window";

describe("isWithinClosureWindow", () => {
  it("is true when today equals the from-date", () => {
    expect(isWithinClosureWindow("2026-08-20", "2026-08-20", "2026-09-04")).toBe(true);
  });

  it("is true when today equals the until-date", () => {
    expect(isWithinClosureWindow("2026-09-04", "2026-08-20", "2026-09-04")).toBe(true);
  });

  it("is false the day before the from-date", () => {
    expect(isWithinClosureWindow("2026-08-19", "2026-08-20", "2026-09-04")).toBe(false);
  });

  it("is false the day after the until-date", () => {
    expect(isWithinClosureWindow("2026-09-05", "2026-08-20", "2026-09-04")).toBe(false);
  });

  it("is true strictly inside the range", () => {
    expect(isWithinClosureWindow("2026-08-25", "2026-08-20", "2026-09-04")).toBe(true);
  });

  it("is false when from is null", () => {
    expect(isWithinClosureWindow("2026-08-25", null, "2026-09-04")).toBe(false);
  });

  it("is false when until is null", () => {
    expect(isWithinClosureWindow("2026-08-25", "2026-08-20", null)).toBe(false);
  });

  it("is false when both from and until are null", () => {
    expect(isWithinClosureWindow("2026-08-25", null, null)).toBe(false);
  });
});
