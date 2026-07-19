import { getSettings } from "@/lib/queries";
import { getBerlinToday, isWithinClosureWindow } from "@/lib/closure-window";
import { localized } from "@/i18n/localized-content";
import type { Locale } from "@/i18n/routing";

/**
 * Seasonal/holiday closure notice. Renders automatically while today's date
 * falls within the admin-configured `closure_banner_from`/`_until` range —
 * no manual daily on/off toggling needed. Pure conditional render, so this
 * stays a Server Component (no client interaction like the cookie dialog).
 */
export default async function ClosureBanner({ locale }: { locale: Locale }) {
  const settings = await getSettings();
  if (!settings?.closure_banner_enabled) return null;
  if (
    !isWithinClosureWindow(
      getBerlinToday(),
      settings.closure_banner_from,
      settings.closure_banner_until,
    )
  ) {
    return null;
  }

  const message = localized(settings, "closure_banner_message", locale);
  if (!message) return null;

  return (
    <div className="bg-primary text-white text-center text-sm px-4 py-2">
      {message}
    </div>
  );
}
