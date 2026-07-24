"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { i18nFromForm } from "@/i18n/fields";
import { intOr, str, strOrNull } from "@/lib/form-data";
import { syncGoogleReviews } from "@/lib/google-reviews";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

export type GoogleSyncState = {
  ok?: boolean;
  imported?: number;
  reason?: string;
};

/**
 * Manueller Anstoß des Google-Bewertungs-Imports über den Admin-Button
 * (force: true umgeht die 24h-Sperre). Der reguläre Import läuft automatisch
 * 1×/Tag über den in-process Scheduler.
 */
export async function importGoogleReviews(
  _prev: GoogleSyncState,
  _fd: FormData,
): Promise<GoogleSyncState> {
  try {
    await guard();
  } catch {
    return { ok: false, reason: "forbidden" };
  }
  const res = await syncGoogleReviews({ force: true });
  revalidatePublic();
  revalidatePath("/admin/reviews");
  return { ok: res.ok, imported: res.imported, reason: res.reason };
}

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

/**
 * Publishes a pending public submission and fills the machine translations
 * (deferred until approval so spam never hits LibreTranslate). Note: the
 * text is treated as German — non-German submissions should be edited/
 * translated in the review form before approving.
 */
export async function approveReview(fd: FormData) {
  const supabase = await guard();
  const id = str(fd, "id");

  const { data } = await supabase
    .from("reviews")
    .select("review_text_de, review_text_i18n")
    .eq("id", id)
    .single();
  await supabase.from("reviews").update({ is_published: true }).eq("id", id);
  if (data) {
    await fillTranslations(supabase, "reviews", id, {
      review_text: {
        i18n: (data.review_text_i18n as Record<string, string>) ?? {},
        source: data.review_text_de ?? "",
      },
    });
  }
  revalidatePublic();
  revalidatePath("/admin/reviews");
}

/**
 * Removes a single submitted photo from a review (moderation): filters the
 * URL out of photo_urls and best-effort deletes the storage object via the
 * admin session client (delete policy on the bucket, like gallery-images).
 */
export async function deleteReviewPhoto(fd: FormData) {
  const supabase = await guard();
  const id = str(fd, "id");
  const url = str(fd, "url");

  const { data } = await supabase.from("reviews").select("photo_urls").eq("id", id).single();
  if (!data) return;
  await supabase
    .from("reviews")
    .update({ photo_urls: (data.photo_urls ?? []).filter((u) => u !== url) })
    .eq("id", id);

  const path = url.split("/").pop();
  if (path) {
    try {
      await supabase.storage.from("review-images").remove([path]);
    } catch (e) {
      console.error("[admin/reviews] Storage-Cleanup fehlgeschlagen:", e);
    }
  }
  revalidatePublic();
  revalidatePath("/admin/reviews");
}

export async function deleteReview(fd: FormData) {
  const supabase = await guard();
  const id = str(fd, "id");
  const { data } = await supabase.from("reviews").select("photo_urls").eq("id", id).single();
  await supabase.from("reviews").delete().eq("id", id);

  // Zugehörige Foto-Objekte best-effort mit entfernen, damit keine Waisen im
  // Bucket zurückbleiben (Muster wie deleteGalleryImage).
  const paths = (data?.photo_urls ?? [])
    .map((u) => u.split("/").pop())
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    try {
      await supabase.storage.from("review-images").remove(paths);
    } catch (e) {
      console.error("[admin/reviews] Storage-Cleanup fehlgeschlagen:", e);
    }
  }
  revalidatePublic();
  revalidatePath("/admin/reviews");
}
