"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { i18nFromForm } from "@/lib/i18n-fields";
import { intOr, numOrNull, str, strOrNull } from "@/lib/form-data";
import { fillTranslations, guard, revalidatePublic, type ActionState } from "./shared";

export type { ActionState } from "./shared";

/* ---------------- Categories ---------------- */

export async function saveCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const id = strOrNull(fd, "id");
    const nameI18n = i18nFromForm((k) => str(fd, k), "name");
    const descI18n = i18nFromForm((k) => str(fd, k), "description");
    const payload = {
      slug: str(fd, "slug") || crypto.randomUUID().slice(0, 8),
      name_de: str(fd, "name_de"),
      name_en: str(fd, "name_en"),
      name_i18n: nameI18n,
      description_de: strOrNull(fd, "description_de"),
      description_en: strOrNull(fd, "description_en"),
      description_i18n: descI18n,
      sort_order: intOr(fd, "sort_order"),
      is_active: fd.get("is_active") === "on",
    };
    if (!payload.name_de || !payload.name_en) return { error: "Name (DE/EN) erforderlich." };

    let catId = id;
    if (id) {
      const res = await supabase.from("menu_categories").update(payload).eq("id", id);
      if (res.error) return { error: res.error.message };
    } else {
      const res = await supabase.from("menu_categories").insert(payload).select("id").single();
      if (res.error) return { error: res.error.message };
      catId = res.data.id;
    }

    await fillTranslations(supabase, "menu_categories", catId!, {
      name: { i18n: nameI18n, source: str(fd, "name_de") },
      description: { i18n: descI18n, source: str(fd, "description_de") },
    });
    revalidatePublic();
    revalidatePath("/admin/menu");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteCategory(fd: FormData) {
  const supabase = await guard();
  await supabase.from("menu_categories").delete().eq("id", str(fd, "id"));
  revalidatePublic();
  revalidatePath("/admin/menu");
}

/* ---------------- Items ---------------- */

export async function saveItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const id = strOrNull(fd, "id");
    const nameI18n = i18nFromForm((k) => str(fd, k), "name");
    const descI18n = i18nFromForm((k) => str(fd, k), "description");
    const payload = {
      category_id: str(fd, "category_id"),
      item_number: strOrNull(fd, "item_number"),
      name_de: str(fd, "name_de"),
      name_en: str(fd, "name_en"),
      name_i18n: nameI18n,
      description_de: strOrNull(fd, "description_de"),
      description_en: strOrNull(fd, "description_en"),
      description_i18n: descI18n,
      price: numOrNull(fd, "price"),
      image_url: strOrNull(fd, "image_url"),
      sort_order: intOr(fd, "sort_order"),
      is_active: fd.get("is_active") === "on",
    };
    if (!payload.category_id) return { error: "Kategorie erforderlich." };
    if (!payload.name_de || !payload.name_en) return { error: "Name (DE/EN) erforderlich." };

    let itemId = id;
    if (id) {
      const res = await supabase.from("menu_items").update(payload).eq("id", id);
      if (res.error) return { error: res.error.message };
    } else {
      const res = await supabase.from("menu_items").insert(payload).select("id").single();
      if (res.error) return { error: res.error.message };
      itemId = res.data.id;
    }

    // Sync allergen/additive links.
    const allergens = fd.getAll("allergens").map(String);
    const additives = fd.getAll("additives").map(String);
    await supabase.from("menu_item_allergens").delete().eq("item_id", itemId!);
    await supabase.from("menu_item_additives").delete().eq("item_id", itemId!);
    if (allergens.length) {
      await supabase
        .from("menu_item_allergens")
        .insert(allergens.map((a) => ({ item_id: itemId!, allergen_id: a })));
    }
    if (additives.length) {
      await supabase
        .from("menu_item_additives")
        .insert(additives.map((a) => ({ item_id: itemId!, additive_id: a })));
    }

    await fillTranslations(supabase, "menu_items", itemId!, {
      name: { i18n: nameI18n, source: str(fd, "name_de") },
      description: { i18n: descI18n, source: str(fd, "description_de") },
    });

    revalidatePublic();
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect("/admin/menu");
}

export async function deleteItem(fd: FormData) {
  const supabase = await guard();
  await supabase.from("menu_items").delete().eq("id", str(fd, "id"));
  revalidatePublic();
  revalidatePath("/admin/menu");
}
