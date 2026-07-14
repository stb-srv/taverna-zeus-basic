import { getTranslations } from "next-intl/server";
import { getItemFormOptions } from "../../data";
import ItemForm from "../../ItemForm";

export default async function NewItemPage() {
  const { categories, allergens, additives } = await getItemFormOptions();
  const t = await getTranslations("admin.menu");
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">{t("newItemTitle")}</h1>
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
