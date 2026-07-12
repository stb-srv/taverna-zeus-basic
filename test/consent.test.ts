import { describe, expect, it } from "vitest";
import {
  CONSENT_VERSION,
  effectiveConsent,
  parseConsent,
  serializeConsent,
} from "@/lib/consent";

describe("parseConsent", () => {
  it("migrates legacy plain strings to a record without timestamp", () => {
    expect(parseConsent("accepted")).toEqual({
      value: "accepted",
      at: null,
      version: CONSENT_VERSION,
    });
    expect(parseConsent("declined")).toEqual({
      value: "declined",
      at: null,
      version: CONSENT_VERSION,
    });
  });

  it("round-trips a serialized consent", () => {
    const at = new Date("2026-07-12T12:00:00.000Z");
    expect(parseConsent(serializeConsent("accepted", at))).toEqual({
      value: "accepted",
      at: "2026-07-12T12:00:00.000Z",
      version: CONSENT_VERSION,
    });
  });

  it("treats missing, corrupt or unknown entries as absent", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent("garbage")).toBeNull();
    expect(parseConsent("{")).toBeNull();
    expect(parseConsent('{"value":"maybe","version":1}')).toBeNull();
    expect(parseConsent('{"value":"accepted"}')).toBeNull();
  });
});

describe("serializeConsent", () => {
  it("stores exactly value, timestamp and text version", () => {
    const raw = serializeConsent("declined", new Date("2026-07-12T08:30:00.000Z"));
    expect(JSON.parse(raw)).toEqual({
      value: "declined",
      at: "2026-07-12T08:30:00.000Z",
      version: CONSENT_VERSION,
    });
  });
});

describe("effectiveConsent", () => {
  it("returns the value for current-version records and legacy strings", () => {
    expect(effectiveConsent(serializeConsent("accepted"))).toBe("accepted");
    expect(effectiveConsent("declined")).toBe("declined");
  });

  it("invalidates consents given for an older text version", () => {
    const outdated = JSON.stringify({
      value: "accepted",
      at: "2026-01-01T00:00:00.000Z",
      version: CONSENT_VERSION - 1,
    });
    expect(effectiveConsent(outdated)).toBeNull();
  });

  it("returns null for absent or corrupt entries", () => {
    expect(effectiveConsent(null)).toBeNull();
    expect(effectiveConsent("kaputt")).toBeNull();
  });
});
