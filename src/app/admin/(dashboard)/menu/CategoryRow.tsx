"use client";

import { useActionState } from "react";
import { saveCategory, deleteCategory, type ActionState } from "@/app/admin/actions/menu";
import { inputCls, btnGhost, btnDanger } from "../ui";
import type { Database } from "@/lib/supabase/types";

type Category = Database["public"]["Tables"]["menu_categories"]["Row"];
const initial: ActionState = {};

export default function CategoryRow({ category }: { category: Category }) {
  const [state, action, pending] = useActionState(saveCategory, initial);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={category.id} />
        <input type="hidden" name="slug" value={category.slug} />
        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">Name (DE)</label>
          <input name="name_de" defaultValue={category.name_de} className={inputCls} />
        </div>
        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">Name (EN)</label>
          <input
            name="name_en"
            defaultValue={category.name_en}
            placeholder="leer = automatisch"
            className={inputCls}
          />
        </div>
        <div className="w-20">
          <label className="mb-1 block text-xs font-medium text-muted">Reihenf.</label>
          <input name="sort_order" type="number" defaultValue={category.sort_order} className={inputCls} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={category.is_active} />
          aktiv
        </label>
        <button type="submit" disabled={pending} className={btnGhost}>
          {pending ? "…" : "Speichern"}
        </button>
        {state.ok && <span className="pb-2 text-xs text-primary">✓</span>}
        {state.error && <span className="w-full text-xs text-accent">{state.error}</span>}
      </form>
      <form action={deleteCategory} onSubmit={(e) => { if (!confirm("Kategorie inkl. Speisen löschen?")) e.preventDefault(); }}>
        <input type="hidden" name="id" value={category.id} />
        <button type="submit" className={btnDanger}>Löschen</button>
      </form>
    </div>
  );
}
