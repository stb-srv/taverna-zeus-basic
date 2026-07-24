import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPublishedReviews, computeReviewStats } from "@/lib/queries";
import { localized } from "@/i18n/localized-content";
import ReviewSubmitForm from "./ReviewSubmitForm";

export async function generateMetadata() {
  const t = await getTranslations("reviews");
  return { title: t("title") };
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("reviews");

  const reviews = await getPublishedReviews();
  const stats = computeReviewStats(reviews);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-gradient mb-4 text-5xl">{t("title")}</h1>
      <p className="mb-2 text-foreground/80">{t("intro")}</p>
      <p className="mb-10 text-sm text-muted">
        {stats.average !== null && (
          <span className="mr-2 text-amber-500" aria-hidden="true">
            ★ {stats.average}
          </span>
        )}
        {t("statsCount", { count: stats.count })}
      </p>

      {reviews.length > 0 ? (
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <article key={r.id} className="card-soft p-5 hover:translate-y-0">
              <div className="mb-2 text-amber-500" aria-hidden="true">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </div>
              <p className="mb-3 text-sm text-foreground/90">{localized(r, "review_text", locale)}</p>
              <p className="text-sm font-medium">{r.author_name}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mb-12 text-sm text-muted">{t("noReviews")}</p>
      )}

      <section className="card-soft max-w-2xl p-6">
        <h2 className="rule-gold mb-6 inline-block text-xl">{t("formHeading")}</h2>
        <ReviewSubmitForm locale={locale} />
      </section>
    </div>
  );
}
