"use client";

import { useTranslations } from "next-intl";
import { setConsent, useConsent } from "@/hooks/use-consent";

/** OpenStreetMap iframe gated behind cookie consent (DSGVO-friendly). */
export default function MapEmbed({ embedUrl }: { embedUrl: string | null }) {
  const t = useTranslations("location");
  const consented = useConsent() === "accepted";

  if (!embedUrl) return null;

  if (!consented) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-border bg-accent-soft/60 p-6 text-center">
        <h3 className="font-display text-lg">{t("mapConsentTitle")}</h3>
        <p className="max-w-md text-sm text-foreground/70">{t("mapConsentText")}</p>
        <button
          type="button"
          onClick={() => setConsent("accepted")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          {t("mapConsentButton")}
        </button>
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      title={t("mapConsentTitle")}
      className="aspect-video w-full rounded-lg border border-border"
      loading="lazy"
      referrerPolicy="no-referrer"
      allowFullScreen
    />
  );
}
