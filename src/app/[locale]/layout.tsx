import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, rtlLocales, type Locale } from "@/i18n/routing";
import { getEnabledLocales } from "@/i18n/locale-state";
import { getNavPages, getSettings } from "@/lib/queries";
import { localized } from "@/i18n/localized-content";
import { fontVars } from "@/lib/fonts";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import FloatingActions from "@/components/FloatingActions";
import ThemeScript from "@/components/ThemeScript";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [settings, enabled] = await Promise.all([getSettings(), getEnabledLocales()]);
  const name = settings?.name ?? "Taverna Zeus";
  const description = settings ? localized(settings, "description", locale as Locale) : undefined;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const localeUrl = `${siteUrl}/${locale}`;
  const languages = Object.fromEntries(enabled.map((l) => [l, `${siteUrl}/${l}`]));
  const images = settings?.hero_image_url ? [{ url: settings.hero_image_url }] : undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: name,
      template: `%s · ${name}`,
    },
    description,
    alternates: {
      canonical: localeUrl,
      languages,
    },
    openGraph: {
      title: name,
      description,
      url: localeUrl,
      siteName: name,
      locale,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images,
    },
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
  // Deactivated locales fall back to the default language instead of a 404.
  const enabled = await getEnabledLocales();
  if (!enabled.includes(locale)) redirect(`/${routing.defaultLocale}`);
  setRequestLocale(locale);

  const [settings, navPages] = await Promise.all([getSettings(), getNavPages()]);
  const name = settings?.name ?? "Taverna Zeus";
  const pages = navPages.map((p) => ({
    slug: p.slug,
    title: localized(p, "title", locale as Locale),
  }));

  return (
    <html
      lang={locale}
      dir={rtlLocales.includes(locale as Locale) ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={fontVars}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <Nav restaurantName={name} locales={enabled} pages={pages} />
          <main className="flex-1">{children}</main>
          <Footer
            restaurantName={name}
            phone={settings?.phone ?? null}
            email={settings?.email ?? null}
            socialLinks={settings?.social_links}
          />
          <CookieBanner />
          <FloatingActions withConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
