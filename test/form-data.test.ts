import { describe, expect, it } from "vitest";
import { intOr, numOrNull, str, strOrNull } from "@/lib/form-data";

function fd(entries: Record<string, string> = {}): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe("str", () => {
  it("trims the value", () => {
    expect(str(fd({ name: "  Gyros  " }), "name")).toBe("Gyros");
  });
  it("returns '' for missing keys", () => {
    expect(str(fd(), "missing")).toBe("");
  });
});

describe("strOrNull", () => {
  it("maps empty and whitespace-only values to null", () => {
    expect(strOrNull(fd({ a: "" }), "a")).toBeNull();
    expect(strOrNull(fd({ a: "   " }), "a")).toBeNull();
    expect(strOrNull(fd(), "missing")).toBeNull();
  });
  it("keeps non-empty values", () => {
    expect(strOrNull(fd({ a: "x" }), "a")).toBe("x");
  });
});

describe("numOrNull", () => {
  it("accepts a German decimal comma", () => {
    expect(numOrNull(fd({ price: "12,50" }), "price")).toBe(12.5);
  });
  it("accepts a decimal point", () => {
    expect(numOrNull(fd({ price: "8.90" }), "price")).toBe(8.9);
  });
  it("returns null for empty or invalid input", () => {
    expect(numOrNull(fd({ price: "" }), "price")).toBeNull();
    expect(numOrNull(fd({ price: "abc" }), "price")).toBeNull();
    expect(numOrNull(fd(), "missing")).toBeNull();
  });
});

describe("intOr", () => {
  it("parses integers", () => {
    expect(intOr(fd({ sort: "7" }), "sort")).toBe(7);
  });
  it("falls back for empty/invalid input", () => {
    expect(intOr(fd({ sort: "" }), "sort")).toBe(0);
    expect(intOr(fd({ sort: "abc" }), "sort", 42)).toBe(42);
  });
});
