"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitReview, type ReviewState } from "../actions/review";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelCls = "mb-1 block text-sm font-medium";

const initial: ReviewState = {};

export default function ReviewSubmitForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(submitReview, initial);
  // Captured once at mount — the timing-trap in the server action rejects
  // submits faster than a human could plausibly fill the form. A non-JS bot
  // that POSTs directly without ever rendering this component leaves the
  // field empty, which the action also treats as a fail.
  const [renderedAt] = useState(() => Date.now());
  const t = useTranslations("reviews");

  if (state.ok) {
    return <p className="text-sm text-primary">{t("success")}</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="form_rendered_at" value={renderedAt} />
      {/* Honeypot — hidden from real visitors, left empty by them. Bots that
          fill every field will trip this. */}
      <div className="absolute h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="review_website">Website</label>
        <input
          id="review_website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="review_first_name">
            {t("firstName")}
          </label>
          <input id="review_first_name" name="first_name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="review_last_name">
            {t("lastName")}
          </label>
          <input id="review_last_name" name="last_name" className={inputCls} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="review_email">
            {t("email")}
          </label>
          <input id="review_email" name="email" type="email" required className={inputCls} />
          <p className="mt-1 text-xs text-muted">{t("emailNotice")}</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="review_rating">
            {t("rating")}
          </label>
          <select id="review_rating" name="rating" defaultValue={5} className={inputCls}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
                {"☆".repeat(5 - n)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="review_text">
          {t("reviewText")}
        </label>
        <textarea
          id="review_text"
          name="review_text"
          required
          rows={5}
          maxLength={2000}
          className={inputCls}
        />
      </div>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-gold to-accent px-8 py-3 font-medium text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
