import { createClient } from "@/lib/supabase/server";

/** Categories + label options used by the item editor. */
export async function getItemFormOptions() {
  const supabase = await createClient();
  const [{ data: categories }, { data: allergens }, { data: additives }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("allergens").select("id, code, name_de").order("code"),
    supabase.from("additives").select("id, code, name_de").order("code"),
  ]);
  return {
    categories: categories ?? [],
    allergens: allergens ?? [],
    additives: additives ?? [],
  };
}
