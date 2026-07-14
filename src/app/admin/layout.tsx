import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { fontVars } from "@/lib/fonts";
import FloatingActions from "@/components/FloatingActions";
import ThemeScript from "@/components/ThemeScript";
import { rtlLocales } from "@/i18n/routing";
import { getAdminLocale, getEnabledLocales } from "@/lib/locales";
import { resolveMessages } from "@/i18n/messages";
import { EnabledLocalesProvider } from "./EnabledLocalesContext";
import "../globals.css";

export const metadata: Metadata = {
  title: "Meraki CMS · Admin",
  robots: { index: false, follow: false },
};

/**
 * Root document for the /admin area. Its display language is its own,
 * cookie-driven choice (via `AdminLanguageSwitcher`) — independent of the
 * public site's URL-based locale routing, since `/admin` isn't nested under
 * `[locale]` and the i18n middleware skips it (see `src/proxy.ts`).
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const enabledLocales = await getEnabledLocales();
  const locale = await getAdminLocale();
  const messages = await resolveMessages(locale);

  return (
    <html
      lang={locale}
      dir={rtlLocales.includes(locale) ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={fontVars}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <EnabledLocalesProvider locales={enabledLocales}>{children}</EnabledLocalesProvider>
        </NextIntlClientProvider>
        <FloatingActions />
      </body>
    </html>
  );
}
