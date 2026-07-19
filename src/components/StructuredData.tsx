import type { Locale } from "@/i18n/routing";
import { getSettings, getOpeningHours, getPublishedReviews, computeReviewStats } from "@/lib/queries";
import { localized } from "@/i18n/localized-content";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { schemaOrgDayName } from "@/lib/schema-day";

/** Sitewide schema.org `Restaurant` JSON-LD (address, hours, aggregateRating, reviews). Self-fetching. */
export default async function StructuredData({ locale }: { locale: Locale }) {
  const [settings, hours, reviews] = await Promise.all([
    getSettings(),
    getOpeningHours(),
    getPublishedReviews(),
  ]);
  if (!settings) return null;

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const stats = computeReviewStats(reviews);

  const socialLinks = settings.social_links as Record<string, { url?: string; enabled?: boolean }> | null;
  const sameAs = SOCIAL_PLATFORMS.map((p) => socialLinks?.[p])
    .filter((l): l is { url: string; enabled: boolean } => !!l?.enabled && !!l.url)
    .map((l) => l.url);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.name,
    description: localized(settings, "description", locale),
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address_street,
      postalCode: settings.address_zip,
      addressLocality: settings.address_city,
      addressCountry: settings.address_country,
    },
    url: `${base}/${locale}`,
    openingHoursSpecification: hours
      .filter((h) => !h.is_closed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: schemaOrgDayName(h.day_of_week),
        opens: h.open_time,
        closes: h.close_time,
      })),
  };

  if (settings.hero_image_url) data.image = settings.hero_image_url;
  if (settings.email) data.email = settings.email;
  if (sameAs.length > 0) data.sameAs = sameAs;

  if (stats.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.average,
      reviewCount: stats.count,
    };
  }

  if (reviews.length > 0) {
    data.review = reviews.map((r) => {
      const rev: Record<string, unknown> = {
        "@type": "Review",
        author: { "@type": "Person", name: r.author_name },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        reviewBody: localized(r, "review_text", locale),
      };
      if (r.review_date) rev.datePublished = r.review_date;
      return rev;
    });
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
