import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Rendered by notFound() calls anywhere under [locale] (e.g. an unknown CMS
 * page slug). Nested inside the [locale] layout, so Nav/Footer/branding are
 * already in place — this only fills the content area. No setRequestLocale()
 * here: Next.js's not-found convention receives no params, but the locale
 * set by the surrounding layout is still active for this request.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-7xl text-gold">404</p>
      <h1 className="text-gradient mt-4 text-4xl">{t("title")}</h1>
      <p className="mt-4 max-w-md text-foreground/70">{t("text")}</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-gradient-to-r from-gold to-accent px-8 py-3.5 font-medium text-white shadow-lg shadow-black/10 transition hover:scale-[1.03]"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
