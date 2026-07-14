import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { deleteItem } from "@/app/admin/actions/menu";
import { btnPrimary, btnGhost, btnDanger } from "../ui";
import MenuTransfer from "./MenuTransfer";

export default async function MenuAdminPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*").order("sort_order"),
  ]);
  const t = await getTranslations("admin.menu");
  const tc = await getTranslations("admin.common");

  const cats = categories ?? [];
  const parentNameById = new Map(cats.map((c) => [c.id, c.name_de]));

  const byCategory = new Map<string, typeof items>();
  for (const it of items ?? []) {
    const list = byCategory.get(it.category_id) ?? [];
    list.push(it);
    byCategory.set(it.category_id, list);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/menu/categories" className={btnGhost}>
            {t("categoriesLink")}
          </Link>
          <Link href="/admin/menu/allergens" className={btnGhost}>
            {t("allergensLink")}
          </Link>
          <Link href="/admin/menu/item/new" className={btnPrimary}>
            {t("newItem")}
          </Link>
        </div>
      </div>

      {/* Items grouped by category */}
      <section className="space-y-6">
        <h2 className="font-display text-xl">{t("itemsHeading")}</h2>
        {cats.map((c) => {
          const list = byCategory.get(c.id) ?? [];
          const heading = c.parent_id
            ? `${parentNameById.get(c.parent_id) ?? ""} › ${c.name_de}`
            : c.name_de;
          return (
            <div key={c.id}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                {heading}
              </h3>
              {list.length === 0 ? (
                <p className="text-sm text-muted">{t("noItems")}</p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                  {list.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 p-3">
                      <span className="w-8 text-sm text-muted">{it.item_number}</span>
                      {it.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.image_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <span className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-border" />
                      )}
                      <span className="flex-1 font-medium">
                        {it.name_de}
                        {!it.is_active && (
                          <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-muted">
                            {t("inactive")}
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-muted">
                        {it.price != null ? `${it.price.toFixed(2)} €` : "—"}
                      </span>
                      <Link href={`/admin/menu/item/${it.id}`} className={btnGhost}>
                        {tc("edit")}
                      </Link>
                      <form action={deleteItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <button type="submit" className={btnDanger}>
                          {tc("delete")}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <MenuTransfer />
    </div>
  );
}
