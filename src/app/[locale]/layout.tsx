import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, rtlLocales, type Locale } from "@/i18n/routing";
import { getSettings } from "@/lib/queries";
import { fontVars } from "@/lib/fonts";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: settings?.name ?? "Taverna Zeus",
      template: `%s · ${settings?.name ?? "Taverna Zeus"}`,
    },
    description: settings?.description_de ?? undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const settings = await getSettings();
  const name = settings?.name ?? "Taverna Zeus";

  return (
    <html
      lang={locale}
      dir={rtlLocales.includes(locale as Locale) ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={fontVars}
    >
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <Nav restaurantName={name} />
          <main className="flex-1">{children}</main>
          <Footer restaurantName={name} phone={settings?.phone ?? null} email={settings?.email ?? null} />
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
