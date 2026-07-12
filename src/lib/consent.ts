/**
 * Consent record stored in localStorage — the choice plus accountability
 * metadata (Zeitpunkt + Textversion, Art. 7 Abs. 1 DSGVO). Pure helpers,
 * unit-tested in test/consent.test.ts.
 */

/**
 * Version of the consent text the visitor agreed to. Increment when
 * `cookie.text` (de) changes in substance — stored consents with a lower
 * version are treated as absent, so the banner asks again.
 */
export const CONSENT_VERSION = 1;

export type ConsentValue = "accepted" | "declined";

export type ConsentRecord = {
  value: ConsentValue;
  /** ISO timestamp of the choice; null for migrated legacy entries. */
  at: string | null;
  version: number;
};

function isConsentValue(v: unknown): v is ConsentValue {
  return v === "accepted" || v === "declined";
}

/**
 * Parses a stored consent entry. Legacy plain strings ("accepted"/"declined",
 * written before metadata existed) are migrated to a record with `at: null`;
 * anything unreadable is treated as absent.
 */
export function parseConsent(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  if (isConsentValue(raw)) return { value: raw, at: null, version: CONSENT_VERSION };
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentRecord> | null;
    if (parsed && isConsentValue(parsed.value) && typeof parsed.version === "number") {
      return {
        value: parsed.value,
        at: typeof parsed.at === "string" ? parsed.at : null,
        version: parsed.version,
      };
    }
  } catch {
    // Corrupt entry → treat as absent.
  }
  return null;
}

/** Serializes a fresh choice with timestamp and the current text version. */
export function serializeConsent(value: ConsentValue, now: Date = new Date()): string {
  const record: ConsentRecord = { value, at: now.toISOString(), version: CONSENT_VERSION };
  return JSON.stringify(record);
}

/** The choice that currently counts — outdated versions require fresh consent. */
export function effectiveConsent(raw: string | null): ConsentValue | null {
  const record = parseConsent(raw);
  return record && record.version >= CONSENT_VERSION ? record.value : null;
}
