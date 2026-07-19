import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPublishedReviews, computeReviewStats } from "@/lib/queries";
import { localized } from "@/i18n/localized-content";

/** "What guests say" section for the home page. Self-fetching; renders nothing when there are no published reviews. */
export default async function Reviews({ locale }: { locale: Locale }) {
  const reviews = await getPublishedReviews();
  if (reviews.length === 0) return null;

  const stats = computeReviewStats(reviews);
  const t = await getTranslations("home");

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl">{t("reviewsHeading")}</h2>
        <p className="mt-1 text-sm text-muted">{t("reviewsCount", { count: stats.count })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
