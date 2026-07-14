import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { btnGhost } from "../../ui";
import AddCategory from "../AddCategory";
import CategoryRow from "../CategoryRow";

export default async function CategoriesAdminPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("menu_categories").select("*").order("sort_order");
  const t = await getTranslations("admin.menu.categories");

  const cats = categories ?? [];
  const topLevel = cats.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, typeof cats>();
  for (const c of cats) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link href="/admin/menu" className={btnGhost}>
          {t("backToMenu")}
        </Link>
      </div>

      <section className="space-y-3">
        {topLevel.map((c) => (
          <div key={c.id} className="space-y-3">
            <CategoryRow category={c} parentOptions={topLevel} hasChildren={childrenByParent.has(c.id)} />
            {(childrenByParent.get(c.id) ?? []).map((child) => (
              <CategoryRow key={child.id} category={child} parentOptions={topLevel} indent />
            ))}
          </div>
        ))}
        <AddCategory parentOptions={topLevel} />
      </section>
    </div>
  );
}
