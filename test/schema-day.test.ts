import { describe, expect, it } from "vitest";
import { schemaOrgDayName } from "@/lib/schema-day";

describe("schemaOrgDayName", () => {
  it("maps 1 to Monday and 7 to Sunday", () => {
    expect(schemaOrgDayName(1)).toBe("Monday");
    expect(schemaOrgDayName(7)).toBe("Sunday");
  });

  it("maps all 7 weekdays correctly", () => {
    expect(schemaOrgDayName(1)).toBe("Monday");
    expect(schemaOrgDayName(2)).toBe("Tuesday");
    expect(schemaOrgDayName(3)).toBe("Wednesday");
    expect(schemaOrgDayName(4)).toBe("Thursday");
    expect(schemaOrgDayName(5)).toBe("Friday");
    expect(schemaOrgDayName(6)).toBe("Saturday");
    expect(schemaOrgDayName(7)).toBe("Sunday");
  });

  it("throws for out-of-range input", () => {
    expect(() => schemaOrgDayName(0)).toThrow();
    expect(() => schemaOrgDayName(8)).toThrow();
  });
});
