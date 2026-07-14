"use client";

import { useActionState } from "react";
import { saveCategory, type ActionState } from "@/app/admin/actions/menu";
import { inputCls, btnPrimary } from "../ui";
import type { Database } from "@/lib/supabase/types";

type Category = Database["public"]["Tables"]["menu_categories"]["Row"];
const initial: ActionState = {};

export default function AddCategory({ parentOptions }: { parentOptions: Category[] }) {
  const [state, action, pending] = useActionState(saveCategory, initial);
  return (
    <form action={action} className="card-soft flex flex-wrap items-end gap-3 p-4 hover:translate-y-0">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">Name (DE)</label>
        <input name="name_de" required className={inputCls} />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">Name (EN)</label>
        <input name="name_en" placeholder="leer = automatisch" className={inputCls} />
      </div>
      <div className="min-w-40">
        <label className="mb-1 block text-xs font-medium text-muted">Übergeordnet</label>
        <select name="parent_id" defaultValue="" className={inputCls}>
          <option value="">— Hauptkategorie —</option>
          {parentOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name_de}</option>
          ))}
        </select>
      </div>
      <div className="w-20">
        <label className="mb-1 block text-xs font-medium text-muted">Reihenf.</label>
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} />
      </div>
      <input type="hidden" name="is_active" value="on" />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "…" : "Kategorie hinzufügen"}
      </button>
      {state.error && <span className="w-full text-sm text-accent">{state.error}</span>}
    </form>
  );
}
