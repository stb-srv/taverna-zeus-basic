"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import {
  closeConsentDialog,
  setConsent,
  useConsent,
  useConsentDialog,
} from "@/hooks/use-consent";
import type { ConsentValue } from "@/lib/consent";

/**
 * DE/EU-friendly cookie banner. Only technically necessary cookies are used;
 * external content (maps) stays blocked until the visitor accepts. After a
 * choice was made, the fingerprint button (FloatingActions) reopens this
 * banner so consent can be reviewed or withdrawn at any time — withdrawing
 * must be as easy as consenting (Art. 7 Abs. 3 DSGVO).
 */
export default function CookieBanner() {
  const t = useTranslations("cookie");
  const consent = useConsent();
  const reopened = useConsentDialog();

  // Visible on first visit (no valid choice) or when reopened for review.
  const visible = consent === null || (reopened && consent !== "unknown");

  // Escape closes the reopened banner without changing the stored choice.
  useEffect(() => {
    if (!reopened || !visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConsentDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reopened, visible]);

  if (!visible) return null;

  const choose = (value: ConsentValue) => {
    setConsent(value);
    closeConsentDialog();
  };

  return (
    <div
      role="dialog"
      aria-label={t("manage")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card shadow-2xl"
    >
      <div
        className={`relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
          reopened ? "pe-10" : ""
        }`}
      >
        <div>
          {reopened && consent !== null && (
            <p className="mb-1 text-sm font-medium">
              {consent === "accepted" ? t("statusAccepted") : t("statusDeclined")}
            </p>
          )}
          <p className="text-sm text-foreground/80">
            {t("text")}{" "}
            <Link href="/datenschutz" className="text-primary underline underline-offset-2">
              {t("more")}
            </Link>
          </p>
        </div>
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
        {reopened && (
          <button
            type="button"
            onClick={closeConsentDialog}
            aria-label={t("close")}
            title={t("close")}
            className="absolute end-2 top-2 rounded-md p-1 text-muted transition hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
