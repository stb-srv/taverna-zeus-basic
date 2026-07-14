import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./supabase/types";

/** Bump when the export shape changes in a non-backwards-compatible way. */
export const MENU_EXPORT_VERSION = 3;

export type ExportCategory = {
  slug: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  sort_order: number;
  is_active: boolean;
  /** Slug of the parent category, or null for a top-level category. */
  parent_slug: string | null;
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
      parent_slug: c.parent_id ? (catSlug.get(c.parent_id) ?? null) : null,
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

/**
 * Resolves `parent_slug` references (from an import manifest) to `parent_id`
 * updates, given the slug→id map built from freshly-inserted categories.
 * Order-independent (both ids already exist by the time this runs). Caps
 * nesting at one level: if the declared parent itself has a `parent_slug` in
 * the source data, the link is dropped rather than creating a 3rd level.
 * Unresolvable or self-referencing links are silently ignored.
 */
export function resolveParentIds(
  categories: Array<{ slug: string; parent_slug: string | null }>,
  idBySlug: Map<string, string>,
): Map<string, string> {
  const parentSlugOf = new Map(categories.map((c) => [c.slug, c.parent_slug]));
  const result = new Map<string, string>();
  for (const c of categories) {
    if (!c.parent_slug) continue;
    if (parentSlugOf.get(c.parent_slug)) continue; // parent itself has a parent — cap at 2 levels
    const childId = idBySlug.get(c.slug);
    const parentId = idBySlug.get(c.parent_slug);
    if (childId && parentId && childId !== parentId) {
      result.set(childId, parentId);
    }
  }
  return result;
}

export type PreservedI18n = { name_i18n: Json; description_i18n: Json };

/**
 * A menu item's natural key, stable across a delete-and-reinsert reimport:
 * its `item_number` when present, otherwise its DE name (scoped to its
 * category, since numbers/names aren't necessarily unique across categories).
 */
export function itemNaturalKey(categorySlug: string, itemNumber: string | null, nameDe: string): string {
  return `${categorySlug}::${itemNumber ?? nameDe}`;
}

/**
 * Keys a snapshot of existing menu items by their natural key, so their
 * `_i18n` data can be re-attached to freshly-reinserted rows after a menu
 * reimport (which otherwise wipes every non-DE/EN translation). Items whose
 * category no longer resolves to a slug are skipped.
 */
export function keyOldItemsBySlug(
  items: Array<{ category_id: string; item_number: string | null; name_de: string } & PreservedI18n>,
  categorySlugById: Map<string, string>,
): Map<string, PreservedI18n> {
  const result = new Map<string, PreservedI18n>();
  for (const it of items) {
    const slug = categorySlugById.get(it.category_id);
    if (!slug) continue;
    result.set(itemNaturalKey(slug, it.item_number, it.name_de), {
      name_i18n: it.name_i18n,
      description_i18n: it.description_i18n,
    });
  }
  return result;
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
