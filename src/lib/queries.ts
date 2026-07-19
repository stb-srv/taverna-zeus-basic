import { createClient } from "@/lib/supabase/server";
import { readDiskCache, writeDiskCache } from "@/lib/disk-cache";

const NAMESPACE = "queries";

/**
 * Logs and mirrors a disk-cache fallback for a failed Supabase read. Every
 * query below calls this in its `error` branch instead of silently
 * returning null/[] on an outage — see src/lib/disk-cache.ts. A legitimate
 * "no rows" result (`error: null`) is never routed through this; it's cached
 * and returned like any other successful read.
 */
function logFallback(key: string, error: unknown): void {
  console.error(`Supabase-Query "${key}" fehlgeschlagen, nutze Cache-Fallback:`, error);
}

/** Restaurant settings singleton (name, description, address, contact, hero, maps embed). */
export async function getSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("restaurant_settings").select("*").eq("id", 1).maybeSingle();
  if (!error) {
    await writeDiskCache(NAMESPACE, "settings", data);
    return data;
  }
  logFallback("settings", error);
  return readDiskCache<typeof data>(NAMESPACE, "settings");
}

/** Opening hours ordered Mon→Sun, then by sort order (supports multiple ranges per day). */
export async function getOpeningHours() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opening_hours")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("sort_order", { ascending: true });
  if (!error) {
    await writeDiskCache(NAMESPACE, "opening_hours", data);
    return data ?? [];
  }
  logFallback("opening_hours", error);
  return (await readDiskCache<typeof data>(NAMESPACE, "opening_hours")) ?? [];
}

/** Kitchen hours ordered Mon→Sun, then by sort order (shown when restaurant_settings.kitchen_hours_enabled is true). */
export async function getKitchenHours() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kitchen_hours")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("sort_order", { ascending: true });
  if (!error) {
    await writeDiskCache(NAMESPACE, "kitchen_hours", data);
    return data ?? [];
  }
  logFallback("kitchen_hours", error);
  return (await readDiskCache<typeof data>(NAMESPACE, "kitchen_hours")) ?? [];
}

async function fetchRawMenu() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select(
      `id, slug, name_de, name_en, name_i18n, description_de, description_en, description_i18n, sort_order, parent_id,
       menu_items (
         id, item_number, name_de, name_en, name_i18n, description_de, description_en, description_i18n,
         price, image_url, sort_order,
         menu_item_allergens ( allergens ( code ) ),
         menu_item_additives ( additives ( code ) )
       )`,
    )
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "menu_items" });
  if (!error) {
    await writeDiskCache(NAMESPACE, "menu", data);
    return data ?? [];
  }
  logFallback("menu", error);
  return (await readDiskCache<typeof data>(NAMESPACE, "menu")) ?? [];
}

type RawCategory = Awaited<ReturnType<typeof fetchRawMenu>>[number];
export type MenuItem = RawCategory["menu_items"][number];
export type MenuCategory = Omit<RawCategory, "menu_items"> & {
  menu_items: MenuItem[];
  subcategories: MenuCategory[];
};

/**
 * Active categories with their active items, each including allergen &
 * additive codes. Returns only top-level categories; each carries its
 * subcategories (one level deep) with their own items nested inside.
 */
export async function getMenu(): Promise<MenuCategory[]> {
  const flat = await fetchRawMenu();
  const byId = new Map<string, MenuCategory>(flat.map((c) => [c.id, { ...c, subcategories: [] }]));
  const roots: MenuCategory[] = [];
  for (const c of flat) {
    const node = byId.get(c.id)!;
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.subcategories.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** All allergen + additive definitions, for the legend on the menu page. */
export async function getLabels() {
  const supabase = await createClient();
  const [{ data: allergens, error: allergensError }, { data: additives, error: additivesError }] =
    await Promise.all([
      supabase.from("allergens").select("*").order("code"),
      supabase.from("additives").select("*").order("code"),
    ]);
  type Labels = { allergens: NonNullable<typeof allergens>; additives: NonNullable<typeof additives> };

  if (!allergensError && !additivesError) {
    const result: Labels = { allergens: allergens ?? [], additives: additives ?? [] };
    await writeDiskCache(NAMESPACE, "labels", result);
    return result;
  }
  logFallback("labels", allergensError ?? additivesError);
  return (await readDiskCache<Labels>(NAMESPACE, "labels")) ?? { allergens: [], additives: [] };
}

/** Published pages flagged for the main navigation, in sort order. */
export async function getNavPages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title_de, title_en, title_i18n, sort_order")
    .eq("is_published", true)
    .eq("show_in_nav", true)
    .order("sort_order");
  if (!error) {
    await writeDiskCache(NAMESPACE, "nav_pages", data);
    return data ?? [];
  }
  logFallback("nav_pages", error);
  return (await readDiskCache<typeof data>(NAMESPACE, "nav_pages")) ?? [];
}

/** Every published page (nav or not) — used to build the sitemap. */
export async function getPublishedPages() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").select("slug, updated_at").eq("is_published", true);
  if (!error) {
    await writeDiskCache(NAMESPACE, "published_pages", data);
    return data ?? [];
  }
  logFallback("published_pages", error);
  return (await readDiskCache<typeof data>(NAMESPACE, "published_pages")) ?? [];
}

/** A single published page by slug (Impressum, Datenschutz, or custom pages). */
export async function getPage(slug: string) {
  const supabase = await createClient();
  const key = `page:${slug}`;
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!error) {
    await writeDiskCache(NAMESPACE, key, data);
    return data;
  }
  logFallback(key, error);
  return readDiskCache<typeof data>(NAMESPACE, key);
}

/** Published reviews in sort order — sole source for both the on-site display and the JSON-LD aggregateRating. */
export async function getPublishedReviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (!error) {
    await writeDiskCache(NAMESPACE, "published_reviews", data);
    return data ?? [];
  }
  logFallback("published_reviews", error);
  return (await readDiskCache<typeof data>(NAMESPACE, "published_reviews")) ?? [];
}

/** Average rating (1 decimal) + count over a set of reviews. Pure so it can be unit-tested without a DB round trip. */
export function computeReviewStats(reviews: { rating: number }[]): { count: number; average: number | null } {
  const count = reviews.length;
  if (count === 0) return { count: 0, average: null };
  const sum = reviews.reduce((total, r) => total + r.rating, 0);
  return { count, average: Math.round((sum / count) * 10) / 10 };
}

/** Gallery images for a given context (e.g. `page:<page-id>`), in sort order. */
export async function getGalleryImages(contextKey: string) {
  const supabase = await createClient();
  const key = `gallery:${contextKey}`;
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("context_key", contextKey)
    .order("sort_order", { ascending: true });
  if (!error) {
    await writeDiskCache(NAMESPACE, key, data);
    return data ?? [];
  }
  logFallback(key, error);
  return (await readDiskCache<typeof data>(NAMESPACE, key)) ?? [];
}
