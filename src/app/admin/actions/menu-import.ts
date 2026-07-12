"use server";

import { revalidatePath } from "next/cache";
import { str } from "@/lib/form-data";
import { guard, revalidatePublic, type ActionState, type AdminClient } from "./shared";

export type { ActionState } from "./shared";

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
  supabase: AdminClient,
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
