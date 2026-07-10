"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { autofillI18n, i18nFromForm, type I18nMap } from "@/lib/i18n-fields";

export type ActionState = { ok?: boolean; error?: string };

type TranslatableTable = "menu_items" | "menu_categories" | "pages" | "restaurant_settings";

/**
 * Computes translations for the given fields (DE = source) and writes the
 * resulting `<field>_i18n` JSONB back to the row. Non-fatal: on any translation
 * error the source/existing values are kept. `overwrite` regenerates the
 * machine locales (used by the "re-translate" action).
 */
async function fillTranslations(
  supabase: Awaited<ReturnType<typeof guard>>,
  table: TranslatableTable,
  id: string | number,
  fields: Record<string, { i18n: I18nMap; source: string }>,
  overwrite = false,
): Promise<void> {
  const { result } = await autofillI18n(fields, { overwrite });
  const patch: Record<string, I18nMap> = {};
  for (const name of Object.keys(fields)) patch[`${name}_i18n`] = result[name];
  await supabase
    .from(table)
    .update(patch as never)
    .eq("id", id as never);
}

/** Refresh the public site after a content change. */
function revalidatePublic() {
  revalidatePath("/", "layout");
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function strOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}
function numOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key).replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function intOr(fd: FormData, key: string, fallback = 0): number {
  const n = parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function guard() {
  const user = await getUser();
  if (!user) throw new Error("Nicht angemeldet");
  return createClient();
}

/* ---------------- Settings ---------------- */

export async function updateSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const descI18n = i18nFromForm((k) => str(fd, k), "description");
    const { error } = await supabase
      .from("restaurant_settings")
      .update({
        name: str(fd, "name") || "Taverna Zeus",
        description_de: strOrNull(fd, "description_de"),
        description_en: strOrNull(fd, "description_en"),
        description_i18n: descI18n,
        address_street: strOrNull(fd, "address_street"),
        address_zip: strOrNull(fd, "address_zip"),
        address_city: strOrNull(fd, "address_city"),
        address_country: strOrNull(fd, "address_country"),
        phone: strOrNull(fd, "phone"),
        email: strOrNull(fd, "email"),
        google_maps_embed: strOrNull(fd, "google_maps_embed"),
        hero_image_url: strOrNull(fd, "hero_image_url"),
      })
      .eq("id", 1);
    if (error) return { error: error.message };
    await fillTranslations(supabase, "restaurant_settings", 1, {
      description: { i18n: descI18n, source: str(fd, "description_de") },
    });
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/* ---------------- Opening hours ---------------- */

export async function updateHours(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const rows = [];
    for (let day = 1; day <= 7; day++) {
      const closed = fd.get(`closed_${day}`) === "on";
      rows.push({
        day_of_week: day,
        is_closed: closed,
        open_time: closed ? null : strOrNull(fd, `open_${day}`),
        close_time: closed ? null : strOrNull(fd, `close_${day}`),
        sort_order: 0,
      });
    }
    // Replace the whole schedule (one range per day).
    const del = await supabase.from("opening_hours").delete().gte("day_of_week", 1);
    if (del.error) return { error: del.error.message };
    const ins = await supabase.from("opening_hours").insert(rows);
    if (ins.error) return { error: ins.error.message };
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

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

/* ---------------- Pages ---------------- */

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
    if (!payload.title_de || !payload.title_en) return { error: "Titel (DE/EN) erforderlich." };

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

/* ---------------- Re-translate (overwrite machine locales) ---------------- */

const RETRANSLATE_FIELDS: Record<string, { table: TranslatableTable; fields: string[] }> = {
  item: { table: "menu_items", fields: ["name", "description"] },
  category: { table: "menu_categories", fields: ["name", "description"] },
  page: { table: "pages", fields: ["title", "content"] },
  settings: { table: "restaurant_settings", fields: ["description"] },
};

/** "Alle neu übersetzen": regenerates el/ru/pl/nl/ar/es from DE (DE/EN kept). */
export async function retranslate(fd: FormData) {
  const supabase = await guard();
  const cfg = RETRANSLATE_FIELDS[str(fd, "kind")];
  if (!cfg) return;
  const id: string | number = cfg.table === "restaurant_settings" ? 1 : str(fd, "id");

  const cols = cfg.fields.flatMap((f) => [`${f}_de`, `${f}_i18n`]).join(", ");
  const { data } = await supabase
    .from(cfg.table)
    .select(cols)
    .eq("id", id as never)
    .single();
  if (!data) return;
  const row = data as unknown as Record<string, unknown>;

  const fields: Record<string, { i18n: I18nMap; source: string }> = {};
  for (const f of cfg.fields) {
    fields[f] = {
      i18n: (row[`${f}_i18n`] ?? {}) as I18nMap,
      source: String(row[`${f}_de`] ?? ""),
    };
  }
  await fillTranslations(supabase, cfg.table, id, fields, true);
  revalidatePublic();
  revalidatePath("/admin", "layout");
}

/* ---------------- Admins ---------------- */

export async function addAdmin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();
    const email = str(fd, "email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
    }
    const { error } = await supabase.from("admins").insert({ email });
    if (error) {
      if (error.code === "23505") return { error: "Diese E-Mail ist bereits Admin." };
      return { error: error.message };
    }
    revalidatePath("/admin/admins");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function removeAdmin(fd: FormData) {
  const user = await getUser();
  if (!user) throw new Error("Nicht angemeldet");
  const email = String(fd.get("email") ?? "").toLowerCase();
  // Prevent locking yourself out.
  if (email === (user.email ?? "").toLowerCase()) return;
  const supabase = await createClient();
  await supabase.from("admins").delete().eq("email", email);
  revalidatePath("/admin/admins");
}

/* ---------------- Menu import / export ---------------- */

const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

/**
 * Reads the import payload, which may be either a ZIP bundle (menu.json +
 * bundled images) or plain JSON (pasted text or a `.json` file). For ZIP
 * bundles every image is re-uploaded to Storage and the manifest's
 * `image_file` references are rewritten to the fresh public URLs.
 */
async function readImportPayload(
  supabase: Awaited<ReturnType<typeof guard>>,
  fd: FormData,
): Promise<{ raw: string; images: Map<string, string> } | { error: string }> {
  const file = fd.get("file");
  const images = new Map<string, string>();

  const isZip =
    file instanceof File &&
    file.size > 0 &&
    (file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip");

  if (isZip) {
    const { unzipSync, strFromU8 } = await import("fflate");
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    } catch {
      return { error: "ZIP-Datei konnte nicht gelesen werden." };
    }
    const manifest = entries["menu.json"];
    if (!manifest) return { error: "Kein menu.json im ZIP-Archiv gefunden." };

    // Upload each bundled image and remember its new public URL.
    for (const [name, bytes] of Object.entries(entries)) {
      if (!name.startsWith("images/") || bytes.length === 0) continue;
      const ext = (name.split(".").pop() ?? "jpg").toLowerCase();
      const dest = `imported/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(dest, bytes, {
        contentType: IMAGE_MIME[ext] ?? "application/octet-stream",
        upsert: false,
      });
      if (!error) {
        const { data } = supabase.storage.from("menu-images").getPublicUrl(dest);
        images.set(name, data.publicUrl);
      }
    }
    return { raw: strFromU8(manifest), images };
  }

  // Plain JSON: pasted text wins, otherwise a selected .json file.
  const pasted = str(fd, "data");
  if (pasted) return { raw: pasted, images };
  if (file instanceof File && file.size > 0) return { raw: await file.text(), images };
  return { error: "Keine Daten zum Importieren." };
}

export async function importMenu(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const supabase = await guard();

    const payload0 = await readImportPayload(supabase, fd);
    if ("error" in payload0) return { error: payload0.error };
    const { raw, images } = payload0;

    let parsed: {
      categories?: Array<Record<string, unknown>>;
      items?: Array<Record<string, unknown>>;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: "Ungültige Daten (kein gültiges JSON)." };
    }
    const categories = parsed.categories ?? [];
    const items = parsed.items ?? [];
    if (categories.length === 0) return { error: "Keine Kategorien im Import gefunden." };

    // Look up existing allergen/additive ids by code.
    const [{ data: allergens }, { data: additives }] = await Promise.all([
      supabase.from("allergens").select("id, code"),
      supabase.from("additives").select("id, code"),
    ]);
    const allergenByCode = new Map((allergens ?? []).map((a) => [a.code, a.id]));
    const additiveByCode = new Map((additives ?? []).map((a) => [a.code, a.id]));

    // Replace the whole menu (categories cascade-delete their items + joins).
    await supabase.from("menu_categories").delete().gte("sort_order", -2147483648);

    const catIns = await supabase
      .from("menu_categories")
      .insert(
        categories.map((c) => ({
          slug: String(c.slug ?? crypto.randomUUID().slice(0, 8)),
          name_de: String(c.name_de ?? ""),
          name_en: String(c.name_en ?? ""),
          description_de: (c.description_de as string) ?? null,
          description_en: (c.description_en as string) ?? null,
          sort_order: Number(c.sort_order ?? 0),
          is_active: c.is_active !== false,
        })),
      )
      .select("id, slug");
    if (catIns.error) return { error: catIns.error.message };
    const catIdBySlug = new Map((catIns.data ?? []).map((c) => [c.slug, c.id]));

    for (const it of items) {
      const categoryId = catIdBySlug.get(String(it.category_slug));
      if (!categoryId) continue;
      // Prefer a freshly-uploaded bundled image; fall back to the stored URL.
      const bundled = it.image_file ? images.get(String(it.image_file)) : undefined;
      const ins = await supabase
        .from("menu_items")
        .insert({
          category_id: categoryId,
          item_number: (it.item_number as string) ?? null,
          name_de: String(it.name_de ?? ""),
          name_en: String(it.name_en ?? ""),
          description_de: (it.description_de as string) ?? null,
          description_en: (it.description_en as string) ?? null,
          price: it.price == null ? null : Number(it.price),
          image_url: bundled ?? (it.image_url as string) ?? null,
          sort_order: Number(it.sort_order ?? 0),
          is_active: it.is_active !== false,
        })
        .select("id")
        .single();
      if (ins.error) continue;
      const itemId = ins.data.id;

      const aCodes = (it.allergen_codes as string[]) ?? [];
      const zCodes = (it.additive_codes as string[]) ?? [];
      const aRows = aCodes
        .map((code) => allergenByCode.get(code))
        .filter(Boolean)
        .map((allergen_id) => ({ item_id: itemId, allergen_id: allergen_id as string }));
      const zRows = zCodes
        .map((code) => additiveByCode.get(code))
        .filter(Boolean)
        .map((additive_id) => ({ item_id: itemId, additive_id: additive_id as string }));
      if (aRows.length) await supabase.from("menu_item_allergens").insert(aRows);
      if (zRows.length) await supabase.from("menu_item_additives").insert(zRows);
    }

    revalidatePublic();
    revalidatePath("/admin/menu");
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
