"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { setConsent, useConsent } from "@/hooks/use-consent";

/**
 * DE/EU-friendly cookie banner. Only technically necessary cookies are used;
 * external content (maps) stays blocked until the visitor accepts.
 */
export default function CookieBanner() {
  const t = useTranslations("cookie");
  const consent = useConsent();

  // Hidden while server-rendered/hydrating and once a choice has been made.
  if (consent !== null) return null;

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
            onClick={() => setConsent("declined")}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent-soft"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
