"use client";

import { useSyncExternalStore } from "react";
import { effectiveConsent, serializeConsent, type ConsentValue } from "@/lib/consent";

export const CONSENT_KEY = "tz-cookie-consent";
const CONSENT_EVENT = "tz-consent-change";
const DIALOG_EVENT = "tz-consent-dialog";

/** `null` = no (valid) choice yet, `"unknown"` = server render / not yet hydrated. */
export type Consent = ConsentValue | "unknown" | null;

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  // Also react to changes made in another tab.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Consent {
  return effectiveConsent(window.localStorage.getItem(CONSENT_KEY));
}

function getServerSnapshot(): Consent {
  return "unknown";
}

/** Current external-content consent choice, kept in sync across components and tabs. */
export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Stores the choice with timestamp + text version and notifies all subscribers. */
export function setConsent(value: ConsentValue): void {
  window.localStorage.setItem(CONSENT_KEY, serializeConsent(value));
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/* ---- Banner dialog state (reopen via the fingerprint button) ---- */

let dialogOpen = false;

function subscribeDialog(onChange: () => void): () => void {
  window.addEventListener(DIALOG_EVENT, onChange);
  return () => window.removeEventListener(DIALOG_EVENT, onChange);
}

/**
 * Whether the consent banner was reopened for review. Withdrawing consent must
 * be as easy as giving it (Art. 7 Abs. 3 DSGVO) — the fingerprint button in
 * FloatingActions opens this dialog at any time after a choice was made.
 */
export function useConsentDialog(): boolean {
  return useSyncExternalStore(
    subscribeDialog,
    () => dialogOpen,
    () => false,
  );
}

export function openConsentDialog(): void {
  dialogOpen = true;
  window.dispatchEvent(new Event(DIALOG_EVENT));
}

export function closeConsentDialog(): void {
  dialogOpen = false;
  window.dispatchEvent(new Event(DIALOG_EVENT));
}
