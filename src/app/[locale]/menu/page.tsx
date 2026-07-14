import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getMenu, getLabels } from "@/lib/queries";
import { localized } from "@/i18n/localized-content";
import MenuBrowser from "./_components/MenuBrowser";

export async function generateMetadata() {
  const t = await getTranslations("menu");
  return { title: t("title") };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("menu");

  const [categories, labels] = await Promise.all([getMenu(), getLabels()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="text-gradient text-5xl">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted">{t("intro")}</p>
      </header>

      <MenuBrowser categories={categories} locale={locale} />

      {/* Allergen & additive legend */}
      {(labels.allergens.length > 0 || labels.additives.length > 0) && (
        <section className="card-soft mt-16 bg-accent-soft/50 p-7 hover:translate-y-0 hover:shadow-[0_1px_2px_rgba(43,35,30,0.04),0_10px_30px_-12px_rgba(15,92,125,0.18)]">
          <h2 className="text-xl">{t("allergensTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("allergensIntro")}</p>
          <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {labels.allergens.map((a) => (
              <div key={a.id} className="flex gap-2">
                <dt className="font-medium">{a.code}</dt>
                <dd className="text-foreground/75">{localized(a, "name", locale)}</dd>
              </div>
            ))}
            {labels.additives.map((a) => (
              <div key={a.id} className="flex gap-2">
                <dt className="font-medium">{a.code}</dt>
                <dd className="text-foreground/75">{localized(a, "name", locale)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
