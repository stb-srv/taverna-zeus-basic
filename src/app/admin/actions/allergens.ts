"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { i18nFromForm } from "@/i18n/fields";
import { str, strOrNull } from "@/lib/form-data";
import { getAdminLocale } from "@/i18n/locale-state";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

/* ---------------- Allergens ---------------- */

export async function saveAllergen(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.errors" });
    const id = strOrNull(fd, "id");
    const nameI18n = i18nFromForm((k) => str(fd, k), "name");
    const payload = {
      code: str(fd, "code"),
      name_de: str(fd, "name_de"),
      name_en: str(fd, "name_en"),
      name_i18n: nameI18n,
    };
    if (!payload.code) return { error: t("codeRequired") };
    if (!payload.name_de) return { error: t("nameDeRequired") };

    let rowId = id;
    if (id) {
      const res = await supabase.from("allergens").update(payload).eq("id", id);
      if (res.error) return { error: res.error.message };
    } else {
      const res = await supabase.from("allergens").insert(payload).select("id").single();
      if (res.error) return { error: res.error.message };
      rowId = res.data.id;
    }

    await fillTranslations(supabase, "allergens", rowId!, {
      name: { i18n: nameI18n, source: str(fd, "name_de") },
    });
    revalidatePublic();
    revalidatePath("/admin/menu/allergens");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteAllergen(fd: FormData) {
  const supabase = await guard();
  const id = str(fd, "id");
  await supabase.from("menu_item_allergens").delete().eq("allergen_id", id);
  await supabase.from("allergens").delete().eq("id", id);
  revalidatePublic();
  revalidatePath("/admin/menu/allergens");
}

/* ---------------- Additives ---------------- */

export async function saveAdditive(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.errors" });
    const id = strOrNull(fd, "id");
    const nameI18n = i18nFromForm((k) => str(fd, k), "name");
    const payload = {
      code: str(fd, "code"),
      name_de: str(fd, "name_de"),
      name_en: str(fd, "name_en"),
      name_i18n: nameI18n,
    };
    if (!payload.code) return { error: t("codeRequired") };
    if (!payload.name_de) return { error: t("nameDeRequired") };

    let rowId = id;
    if (id) {
      const res = await supabase.from("additives").update(payload).eq("id", id);
      if (res.error) return { error: res.error.message };
    } else {
      const res = await supabase.from("additives").insert(payload).select("id").single();
      if (res.error) return { error: res.error.message };
      rowId = res.data.id;
    }

    await fillTranslations(supabase, "additives", rowId!, {
      name: { i18n: nameI18n, source: str(fd, "name_de") },
    });
    revalidatePublic();
    revalidatePath("/admin/menu/allergens");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteAdditive(fd: FormData) {
  const supabase = await guard();
  const id = str(fd, "id");
  await supabase.from("menu_item_additives").delete().eq("additive_id", id);
  await supabase.from("additives").delete().eq("id", id);
  revalidatePublic();
  revalidatePath("/admin/menu/allergens");
}
