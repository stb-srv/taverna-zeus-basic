import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

/** Bump when the export shape changes in a non-backwards-compatible way. */
export const MENU_EXPORT_VERSION = 2;

export type ExportCategory = {
  slug: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ExportItem = {
  category_slug: string | null;
  item_number: string | null;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  price: number | null;
  /** Original image URL as stored in the DB (local path or Supabase Storage URL). */
  image_url: string | null;
  /** Relative path of the bundled image file inside the ZIP, e.g. `images/gyros.jpg`. */
  image_file: string | null;
  sort_order: number;
  is_active: boolean;
  allergen_codes: string[];
  additive_codes: string[];
};

export type MenuManifest = {
  version: number;
  exported_at: string;
  categories: ExportCategory[];
  items: ExportItem[];
};

/**
 * Reads the full menu (categories + items with their allergen/additive codes)
 * and shapes it into a portable manifest. `image_file` is left null here and
 * filled in by the export route once each image has been bundled.
 */
export async function collectMenu(
  supabase: SupabaseClient<Database>,
): Promise<MenuManifest> {
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase
      .from("menu_items")
      .select("*, menu_item_allergens(allergens(code)), menu_item_additives(additives(code))")
      .order("sort_order"),
  ]);

  const catSlug = new Map((categories ?? []).map((c) => [c.id, c.slug]));

  return {
    version: MENU_EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    categories: (categories ?? []).map((c) => ({
      slug: c.slug,
      name_de: c.name_de,
      name_en: c.name_en,
      description_de: c.description_de,
      description_en: c.description_en,
      sort_order: c.sort_order,
      is_active: c.is_active,
    })),
    items: (items ?? []).map((i) => ({
      category_slug: catSlug.get(i.category_id) ?? null,
      item_number: i.item_number,
      name_de: i.name_de,
      name_en: i.name_en,
      description_de: i.description_de,
      description_en: i.description_en,
      price: i.price,
      image_url: i.image_url,
      image_file: null,
      sort_order: i.sort_order,
      is_active: i.is_active,
      allergen_codes: i.menu_item_allergens
        .map((a) => a.allergens?.code)
        .filter(Boolean) as string[],
      additive_codes: i.menu_item_additives
        .map((a) => a.additives?.code)
        .filter(Boolean) as string[],
    })),
  };
}

/** Turns an image URL/path into a safe, unique filename for the ZIP `images/` folder. */
export function imageFileName(url: string, taken: Set<string>): string {
  let base = "";
  try {
    // Handles both absolute URLs and root-relative paths.
    const u = new URL(url, "http://local");
    base = u.pathname.split("/").pop() ?? "";
  } catch {
    base = url.split("/").pop() ?? "";
  }
  base = base.split("?")[0].trim() || "bild";
  // Strip anything unusual; keep letters, numbers, dot, dash, underscore.
  base = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!/\.[a-zA-Z0-9]+$/.test(base)) base += ".jpg";

  let name = base;
  let n = 1;
  while (taken.has(name)) {
    const dot = base.lastIndexOf(".");
    name = `${base.slice(0, dot)}-${n}${base.slice(dot)}`;
    n++;
  }
  taken.add(name);
  return name;
}
