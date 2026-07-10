import { getItemFormOptions } from "../../data";
import ItemForm from "../../ItemForm";

export default async function NewItemPage() {
  const { categories, allergens, additives } = await getItemFormOptions();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Neue Speise</h1>
      <ItemForm
        item={null}
        categories={categories}
        allergens={allergens}
        additives={additives}
        selectedAllergens={[]}
        selectedAdditives={[]}
      />
    </div>
  );
}
