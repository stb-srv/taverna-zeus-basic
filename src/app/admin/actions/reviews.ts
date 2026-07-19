"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { i18nFromForm } from "@/i18n/fields";
import { intOr, str, strOrNull } from "@/lib/form-data";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

export async function saveReview(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const id = strOrNull(fd, "id");

    const authorName = str(fd, "author_name");
    if (!authorName) return { error: "Name ist erforderlich." };

    const rating = Number(str(fd, "rating"));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { error: "Bewertung muss zwischen 1 und 5 liegen." };
    }

    const reviewTextI18n = i18nFromForm((k) => str(fd, k), "review_text");
    const reviewTextDe = str(fd, "review_text_de");

    const payload = {
      author_name: authorName,
      rating,
      review_date: strOrNull(fd, "review_date"),
      source: str(fd, "source") || "google",
      review_text_de: reviewTextDe,
      review_text_i18n: reviewTextI18n,
      is_published: fd.get("is_published") === "on",
      sort_order: intOr(fd, "sort_order"),
    };

    let reviewId = id;
    if (id) {
      const res = await supabase.from("reviews").update(payload).eq("id", id);
      if (res.error) return { error: res.error.message };
    } else {
      const res = await supabase.from("reviews").insert(payload).select("id").single();
      if (res.error) return { error: res.error.message };
      reviewId = res.data.id;
    }

    await fillTranslations(supabase, "reviews", reviewId!, {
      review_text: { i18n: reviewTextI18n, source: reviewTextDe },
    });
    revalidatePublic();
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect("/admin/reviews");
}

export async function deleteReview(fd: FormData) {
  const supabase = await guard();
  await supabase.from("reviews").delete().eq("id", str(fd, "id"));
  revalidatePublic();
  revalidatePath("/admin/reviews");
}
