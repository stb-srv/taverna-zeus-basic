import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getItemFormOptions } from "../../data";
import ItemForm from "../../ItemForm";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: item }, options] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*, menu_item_allergens(allergen_id), menu_item_additives(additive_id)")
      .eq("id", id)
      .maybeSingle(),
    getItemFormOptions(),
  ]);

  if (!item) notFound();

  const selectedAllergens = item.menu_item_allergens.map((a) => a.allergen_id);
  const selectedAdditives = item.menu_item_additives.map((a) => a.additive_id);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Speise bearbeiten</h1>
      <ItemForm
        item={item}
        categories={options.categories}
        allergens={options.allergens}
        additives={options.additives}
        selectedAllergens={selectedAllergens}
        selectedAdditives={selectedAdditives}
      />
    </div>
  );
}
