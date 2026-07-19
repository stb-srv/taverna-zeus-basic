"use server";

import { i18nFromForm } from "@/i18n/fields";
import { str, strOrNull } from "@/lib/form-data";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

/** Adds an image to a gallery. `context_key` and `image_url` are populated client-side
 * (see `GalleryUpload`) before this is called — `image_url` comes from a direct
 * browser upload to the `gallery-images` storage bucket. */
export async function addGalleryImage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const contextKey = str(fd, "context_key");
    const imageUrl = str(fd, "image_url");
    const altDe = strOrNull(fd, "alt_de");
    if (!contextKey || !imageUrl) return { error: "context_key und image_url erforderlich." };

    const { data: existing } = await supabase
      .from("gallery_images")
      .select("sort_order")
      .eq("context_key", contextKey)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const altI18n = i18nFromForm((k) => str(fd, k), "alt");
    const { data: row, error } = await supabase
      .from("gallery_images")
      .insert({
        context_key: contextKey,
        image_url: imageUrl,
        alt_de: altDe,
        alt_i18n: altI18n,
        sort_order: nextSortOrder,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };

    if (altDe) {
      await fillTranslations(supabase, "gallery_images", row.id, {
        alt: { i18n: altI18n, source: altDe },
      });
    }
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Deletes a gallery row and best-effort removes the underlying storage object
 * (derived from the trailing filename segment of its public URL). Storage removal
 * failures are logged but never fail the action. */
export async function deleteGalleryImage(fd: FormData): Promise<void> {
  const supabase = await guard();
  const id = str(fd, "id");
  const { data: row } = await supabase
    .from("gallery_images")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("gallery_images").delete().eq("id", id);
  if (row?.image_url) {
    try {
      const path = row.image_url.split("/").pop();
      if (path) await supabase.storage.from("gallery-images").remove([path]);
    } catch (e) {
      console.error("Failed to remove gallery storage object", e);
    }
  }
  revalidatePublic();
}

/** Swaps `sort_order` between a gallery image and its neighbor in the given
 * direction, scoped to its own `context_key`. No-op at the start/end of the list. */
export async function reorderGalleryImage(fd: FormData): Promise<void> {
  const supabase = await guard();
  const id = str(fd, "id");
  const direction = str(fd, "direction");

  const { data: current } = await supabase
    .from("gallery_images")
    .select("context_key")
    .eq("id", id)
    .maybeSingle();
  if (!current) return;

  const { data: rows } = await supabase
    .from("gallery_images")
    .select("id, sort_order")
    .eq("context_key", current.context_key)
    .order("sort_order", { ascending: true });
  if (!rows) return;

  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) return;

  const a = rows[index];
  const b = rows[targetIndex];
  await supabase.from("gallery_images").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("gallery_images").update({ sort_order: a.sort_order }).eq("id", b.id);
  revalidatePublic();
}

/** Updates a gallery image's DE alt text and (re)translates it when non-empty. */
export async function updateGalleryImageAlt(fd: FormData): Promise<void> {
  const supabase = await guard();
  const id = str(fd, "id");
  const altDe = strOrNull(fd, "alt_de");
  await supabase.from("gallery_images").update({ alt_de: altDe }).eq("id", id);
  if (altDe) {
    const altI18n = i18nFromForm((k) => str(fd, k), "alt");
    await fillTranslations(supabase, "gallery_images", id, {
      alt: { i18n: altI18n, source: altDe },
    });
  }
  revalidatePublic();
}
