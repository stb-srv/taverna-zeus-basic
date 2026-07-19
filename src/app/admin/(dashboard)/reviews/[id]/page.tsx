import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import ReviewForm from "../ReviewForm";

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: review } = await supabase.from("reviews").select("*").eq("id", id).maybeSingle();
  if (!review) notFound();
  const t = await getTranslations("admin.reviews");

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">{t("editReview")}</h1>
      <ReviewForm review={review} />
    </div>
  );
}
