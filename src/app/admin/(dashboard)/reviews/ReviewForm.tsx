"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveReview, type ActionState } from "@/app/admin/actions/reviews";
import { inputCls, labelCls, btnPrimary, btnGhost } from "@/components/admin/ui-classes";
import TranslationsPanel from "@/components/admin/TranslationsPanel";
import type { Database } from "@/lib/supabase/types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];
type I18n = Record<string, string>;
const initial: ActionState = {};

export default function ReviewForm({ review }: { review: Review | null }) {
  const [state, action, pending] = useActionState(saveReview, initial);
  const t = useTranslations("admin.reviews");
  const tc = useTranslations("admin.common");

  return (
    <form action={action} className="max-w-2xl space-y-6">
      {review && <input type="hidden" name="id" value={review.id} />}

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        {review?.email && (
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-muted">
            {t("submitterEmail")}: {review.email}
            {review.first_name && (
              <>
                {" — "}
                {review.first_name} {review.last_name ?? ""}
              </>
            )}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("authorName")}</label>
            <input
              name="author_name"
              defaultValue={review?.author_name ?? ""}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("rating")}</label>
            <select name="rating" defaultValue={review?.rating ?? 5} className={inputCls}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("reviewDate")}</label>
            <input
              type="date"
              name="review_date"
              defaultValue={review?.review_date ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("source")}</label>
            <input
              name="source"
              defaultValue={review?.source ?? "google"}
              placeholder="google"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>{t("reviewTextDe")}</label>
          <textarea
            name="review_text_de"
            defaultValue={review?.review_text_de ?? ""}
            rows={5}
            className={inputCls}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={review?.is_published ?? true} />
            {t("published")}
          </label>
          <div className="w-28">
            <label className={labelCls}>{t("sortOrder")}</label>
            <input name="sort_order" type="number" defaultValue={review?.sort_order ?? 0} className={inputCls} />
          </div>
        </div>
      </section>

      <TranslationsPanel
        fields={[
          {
            name: "review_text",
            label: t("reviewTextDe"),
            multiline: true,
            values: (review?.review_text_i18n as I18n) ?? {},
          },
        ]}
      />

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tc("saving") : tc("save")}
        </button>
        <Link href="/admin/reviews" className={btnGhost}>
          {tc("cancel")}
        </Link>
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
