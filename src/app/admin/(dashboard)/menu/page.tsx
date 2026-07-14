import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteItem } from "@/app/admin/actions/menu";
import { btnPrimary, btnGhost, btnDanger } from "../ui";
import AddCategory from "./AddCategory";
import CategoryRow from "./CategoryRow";
import MenuTransfer from "./MenuTransfer";

export default async function MenuAdminPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*").order("sort_order"),
  ]);

  const cats = categories ?? [];
  const topLevel = cats.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, typeof cats>();
  for (const c of cats) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }
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
          <h1 className="font-display text-3xl">Speisekarte</h1>
          <p className="mt-1 text-sm text-muted">Kategorien und Speisen verwalten.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/menu/allergens" className={btnGhost}>
            Allergene &amp; Zusatzstoffe
          </Link>
          <Link href="/admin/menu/item/new" className={btnPrimary}>
            + Neue Speise
          </Link>
        </div>
      </div>

      {/* Categories */}
      <section className="space-y-3">
        <h2 className="font-display text-xl">Kategorien</h2>
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

      {/* Items grouped by category */}
      <section className="space-y-6">
        <h2 className="font-display text-xl">Speisen</h2>
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
                <p className="text-sm text-muted">Keine Speisen.</p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                  {list.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 p-3">
                      <span className="w-8 text-sm text-muted">{it.item_number}</span>
                      <span className="flex-1 font-medium">
                        {it.name_de}
                        {!it.is_active && (
                          <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-muted">
                            inaktiv
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-muted">
                        {it.price != null ? `${it.price.toFixed(2)} €` : "—"}
                      </span>
                      <Link href={`/admin/menu/item/${it.id}`} className={btnGhost}>
                        Bearbeiten
                      </Link>
                      <form action={deleteItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <button type="submit" className={btnDanger}>
                          Löschen
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
