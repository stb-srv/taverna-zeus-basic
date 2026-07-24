"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveReview, deleteReviewPhoto, type ActionState } from "@/app/admin/actions/reviews";
import { inputCls, labelCls, btnPrimary, btnGhost } from "@/components/admin/ui-classes";
import TranslationsPanel from "@/components/admin/TranslationsPanel";
import type { Database } from "@/lib/supabase/types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];
type I18n = Record<string, string>;
const initial: ActionState = {};

export default function ReviewForm({ review }: { review: Review | null }) {
  const [state, action, pending] = useActionState(saveReview, initial);
  const router = useRouter();
  const t = useTranslations("admin.reviews");
  const tc = useTranslations("admin.common");

  async function onDeletePhoto(url: string) {
    if (!review || !confirm(t("photoDeleteConfirm"))) return;
    const fd = new FormData();
    fd.set("id", review.id);
    fd.set("url", url);
    await deleteReviewPhoto(fd);
    router.refresh();
  }

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

        {review && (review.photo_urls ?? []).length > 0 && (
          <div>
            <span className={labelCls}>{t("photos")}</span>
            <div className="flex flex-wrap gap-2">
              {(review.photo_urls ?? []).map((url) => (
                <div key={url} className="relative">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Admin-Thumbnail, Muster wie GalleryUpload */}
                    <img
                      src={url}
                      alt=""
                      className="h-20 w-20 rounded-lg border border-border object-cover"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(url)}
                    aria-label={t("photoDelete")}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs leading-none text-white shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
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
