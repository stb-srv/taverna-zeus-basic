"use client";

import { useActionState } from "react";
import { saveCategory, type ActionState } from "@/app/admin/actions/menu";
import { inputCls, btnPrimary } from "../ui";

const initial: ActionState = {};

export default function AddCategory() {
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
