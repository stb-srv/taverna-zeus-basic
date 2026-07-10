import { createClient } from "@/lib/supabase/server";

/** Restaurant settings singleton (name, description, address, contact, hero, maps embed). */
export async function getSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data;
}

/** Opening hours ordered Mon→Sun, then by sort order (supports multiple ranges per day). */
export async function getOpeningHours() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opening_hours")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("sort_order", { ascending: true });
  return data ?? [];
}

/** Active categories with their active items, each including allergen & additive codes. */
export async function getMenu() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_categories")
    .select(
      `id, slug, name_de, name_en, name_i18n, description_de, description_en, description_i18n, sort_order,
       menu_items (
         id, item_number, name_de, name_en, name_i18n, description_de, description_en, description_i18n,
         price, image_url, sort_order,
         menu_item_allergens ( allergens ( code ) ),
         menu_item_additives ( additives ( code ) )
       )`,
    )
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "menu_items" });
  return data ?? [];
}

/** All allergen + additive definitions, for the legend on the menu page. */
export async function getLabels() {
  const supabase = await createClient();
  const [{ data: allergens }, { data: additives }] = await Promise.all([
    supabase.from("allergens").select("*").order("code"),
    supabase.from("additives").select("*").order("code"),
  ]);
  return { allergens: allergens ?? [], additives: additives ?? [] };
}

/** A single published page by slug (Impressum, Datenschutz, or custom pages). */
export async function getPage(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data;
}

export type MenuCategory = Awaited<ReturnType<typeof getMenu>>[number];
export type MenuItem = MenuCategory["menu_items"][number];
