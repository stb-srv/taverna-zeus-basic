"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { sendReviewNotification } from "@/lib/mail";
import { str, strOrNull } from "@/lib/form-data";
import { MIN_FILL_TIME_MS, createRateLimiter, getClientIp, logSpamBlock } from "@/lib/spam-guard";
import { publicReviewName } from "@/lib/review-name";
import type { Locale } from "@/i18n/routing";

export type ReviewState = { ok?: boolean; error?: string };

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const isRateLimited = createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

const MAX_TEXT_LENGTH = 2000;

/**
 * Public review submission from /bewertungen. Inserts unpublished — the RLS
 * policy `reviews_public_insert` pins is_published=false/source='website',
 * so approval can only happen via the admin. No revalidate here: nothing
 * public changes until the admin approves.
 */
export async function submitReview(_prev: ReviewState, fd: FormData): Promise<ReviewState> {
  const locale = (strOrNull(fd, "locale") ?? "de") as Locale;
  const t = await getTranslations({ locale, namespace: "reviews" });
  const ip = await getClientIp();

  // Honeypot: real visitors never fill this hidden field.
  if (str(fd, "website") !== "") {
    await logSpamBlock("honeypot", ip, locale);
    return { ok: true };
  }

  // Timing trap: the field carries the form's client-render timestamp, so a
  // submit faster than MIN_FILL_TIME_MS is not human.
  const renderedAt = Number(str(fd, "form_rendered_at"));
  if (!renderedAt || Date.now() - renderedAt < MIN_FILL_TIME_MS) {
    await logSpamBlock("too_fast", ip, locale);
    return { ok: true };
  }

  if (isRateLimited(ip)) {
    console.warn(`[reviews] rate limited: ip=${ip}`);
    return { error: t("errorRateLimited") };
  }

  const firstName = str(fd, "first_name");
  const lastName = strOrNull(fd, "last_name");
  const email = str(fd, "email");
  const reviewText = str(fd, "review_text");
  const rating = Number(str(fd, "rating"));

  if (!firstName || !reviewText) return { error: t("errorRequired") };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t("errorEmail") };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: t("errorGeneric") };
  if (reviewText.length > MAX_TEXT_LENGTH) return { error: t("errorGeneric") };

  try {
    const supabase = await createClient();
    // Kein .select(): anon darf email/first_name/last_name nicht zurücklesen
    // (Spalten-Grants), ein Insert mit Rückgabe würde deshalb fehlschlagen.
    const { error } = await supabase.from("reviews").insert({
      author_name: publicReviewName(firstName, lastName),
      first_name: firstName,
      last_name: lastName,
      email,
      rating,
      review_text_de: reviewText,
      review_date: new Date().toISOString().slice(0, 10),
      source: "website",
      is_published: false,
      sort_order: 0,
    });
    if (error) {
      console.error("[reviews] insert failed:", error.code, error.message, error.details);
      return { error: t("errorGeneric") };
    }

    await sendReviewNotification({ firstName, lastName, email, rating, text: reviewText, locale });
    return { ok: true };
  } catch (e) {
    console.error("[reviews] unexpected error:", e);
    return { error: t("errorGeneric") };
  }
}
