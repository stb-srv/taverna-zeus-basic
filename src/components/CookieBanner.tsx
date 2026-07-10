"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const CONSENT_KEY = "tz-cookie-consent";

/** Reads the stored map/external-content consent choice ("accepted" | "declined" | null). */
export function readConsent(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CONSENT_KEY);
}

/**
 * DE/EU-friendly cookie banner. Only technically necessary cookies are used;
 * external content (maps) stays blocked until the visitor accepts.
 */
export default function CookieBanner() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
    // Let consent-gated components (e.g. the map) react without a reload.
    window.dispatchEvent(new Event("tz-consent-change"));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card shadow-2xl"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground/80">
          {t("text")}{" "}
          <Link href="/datenschutz" className="text-primary underline underline-offset-2">
            {t("more")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent-soft"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
