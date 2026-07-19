import { getTranslations } from "next-intl/server";
import ReviewForm from "../ReviewForm";

export default async function NewReviewPage() {
  const t = await getTranslations("admin.reviews");
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">{t("newReviewTitle")}</h1>
      <ReviewForm review={null} />
    </div>
  );
}
