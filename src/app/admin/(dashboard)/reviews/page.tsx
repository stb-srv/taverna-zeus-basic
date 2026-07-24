import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { btnPrimary, btnGhost } from "@/components/admin/ui-classes";
import { approveReview } from "@/app/admin/actions/reviews";
import DeleteReviewButton from "./DeleteReviewButton";

export default async function ReviewsAdminPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase.from("reviews").select("*").order("sort_order");
  const t = await getTranslations("admin.reviews");
  const tc = await getTranslations("admin.common");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link href="/admin/reviews/new" className={btnPrimary}>
          {t("newReview")}
        </Link>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {(reviews ?? []).map((r) => (
          <li key={r.id} className="flex items-center gap-3 p-3">
            <span className="flex-1">
              <span className="font-medium">{r.author_name}</span>
              <span className="ml-2 text-sm text-amber-500" aria-hidden="true">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </span>
              {r.review_date && <span className="ml-2 text-xs text-muted">{r.review_date}</span>}
              {r.is_published ? (
                <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-muted">
                  {t("published")}
                </span>
              ) : (
                <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-xs text-muted">
                  {t("pending")}
                </span>
              )}
            </span>
            {!r.is_published && (
              <form action={approveReview}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className={btnGhost}>
                  {t("approve")}
                </button>
              </form>
            )}
            <Link href={`/admin/reviews/${r.id}`} className={btnGhost}>
              {tc("edit")}
            </Link>
            <DeleteReviewButton id={r.id} />
          </li>
        ))}
        {(reviews ?? []).length === 0 && <li className="p-4 text-sm text-muted">{t("noReviews")}</li>}
      </ul>
    </div>
  );
}
