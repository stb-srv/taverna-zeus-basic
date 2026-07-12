"use client";

import { useTranslations } from "next-intl";
import { openConsentDialog, useConsent, useConsentDialog } from "@/hooks/use-consent";
import ThemeToggle from "./ThemeToggle";

const stackCls = "fixed bottom-4 end-4 z-40 flex flex-col gap-2";
const fabCls =
  "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition hover:bg-accent-soft";

/**
 * Floating action stack in the bottom end corner (follows the scroll): the
 * theme toggle everywhere, plus the fingerprint consent-settings button on
 * the public site (`withConsent`). Mounted once per document root — pages
 * never wire it themselves. Hidden while the consent banner is on screen.
 * `withConsent` requires a NextIntlClientProvider (public layout only).
 */
export default function FloatingActions({ withConsent = false }: { withConsent?: boolean }) {
  if (!withConsent) {
    return (
      <div className={stackCls}>
        <ThemeToggle className={fabCls} />
      </div>
    );
  }
  return <PublicActions />;
}

function PublicActions() {
  const t = useTranslations();
  const consent = useConsent();
  const reopened = useConsentDialog();

  // While the banner itself is visible the stack would only get in the way.
  if (consent === null || reopened) return null;

  return (
    <div className={stackCls}>
      <button
        type="button"
        onClick={openConsentDialog}
        aria-label={t("cookie.manage")}
        title={t("cookie.manage")}
        className={fabCls}
      >
        <FingerprintIcon />
      </button>
      <ThemeToggle
        className={fabCls}
        labelDark={t("theme.toDark")}
        labelLight={t("theme.toLight")}
      />
    </div>
  );
}

function FingerprintIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}
