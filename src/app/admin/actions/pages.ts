"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { i18nFromForm } from "@/lib/i18n-fields";
import { intOr, str, strOrNull } from "@/lib/form-data";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

export async function savePage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const id = strOrNull(fd, "id");
    const titleI18n = i18nFromForm((k) => str(fd, k), "title");
    const contentI18n = i18nFromForm((k) => str(fd, k), "content");
    const payload = {
      slug: str(fd, "slug"),
      title_de: str(fd, "title_de"),
      title_en: str(fd, "title_en"),
      title_i18n: titleI18n,
      content_de: strOrNull(fd, "content_de"),
      content_en: strOrNull(fd, "content_en"),
      content_i18n: contentI18n,
      is_published: fd.get("is_published") === "on",
      show_in_nav: fd.get("show_in_nav") === "on",
      sort_order: intOr(fd, "sort_order"),
    };
    if (!payload.slug) return { error: "Slug erforderlich." };
    if (!payload.title_de) return { error: "Titel (DE) erforderlich." };

    let pageId = id;
    if (id) {
      const res = await supabase.from("pages").update(payload).eq("id", id);
      if (res.error) return { error: res.error.message };
    } else {
      const res = await supabase.from("pages").insert(payload).select("id").single();
      if (res.error) return { error: res.error.message };
      pageId = res.data.id;
    }

    await fillTranslations(supabase, "pages", pageId!, {
      title: { i18n: titleI18n, source: str(fd, "title_de") },
      content: { i18n: contentI18n, source: str(fd, "content_de") },
    });
    revalidatePublic();
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect("/admin/pages");
}

export async function deletePage(fd: FormData) {
  const supabase = await guard();
  await supabase.from("pages").delete().eq("id", str(fd, "id"));
  revalidatePublic();
  revalidatePath("/admin/pages");
}
