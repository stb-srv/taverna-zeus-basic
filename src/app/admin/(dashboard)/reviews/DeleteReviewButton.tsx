"use client";

import { useTranslations } from "next-intl";
import { deleteReview } from "@/app/admin/actions/reviews";
import { btnDanger } from "@/components/admin/ui-classes";

export default function DeleteReviewButton({ id }: { id: string }) {
  const t = useTranslations("admin.reviews");
  const tc = useTranslations("admin.common");

  return (
    <form
      action={deleteReview}
      onSubmit={(e) => {
        if (!confirm(t("deleteConfirm"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={btnDanger}>
        {tc("delete")}
      </button>
    </form>
  );
}
