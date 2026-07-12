"use client";

import { useSyncExternalStore } from "react";

export const CONSENT_KEY = "tz-cookie-consent";
const CONSENT_EVENT = "tz-consent-change";

/** `null` = no choice yet, `"unknown"` = server render / not yet hydrated. */
export type Consent = "accepted" | "declined" | "unknown" | null;

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
  return window.localStorage.getItem(CONSENT_KEY) as Consent;
}

function getServerSnapshot(): Consent {
  return "unknown";
}

/** Current external-content consent choice, kept in sync across components and tabs. */
export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Stores the choice and notifies all `useConsent` subscribers. */
export function setConsent(value: "accepted" | "declined"): void {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
