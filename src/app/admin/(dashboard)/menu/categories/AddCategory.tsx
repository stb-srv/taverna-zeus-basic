"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveCategory, type ActionState } from "@/app/admin/actions/menu";
import { inputCls, btnPrimary } from "@/components/admin/ui";
import type { Database } from "@/lib/supabase/types";

type Category = Database["public"]["Tables"]["menu_categories"]["Row"];
const initial: ActionState = {};

export default function AddCategory({ parentOptions }: { parentOptions: Category[] }) {
  const [state, action, pending] = useActionState(saveCategory, initial);
  const t = useTranslations("admin.menu.categories");
  return (
    <form action={action} className="card-soft flex flex-wrap items-end gap-3 p-4 hover:translate-y-0">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">{t("nameDe")}</label>
        <input name="name_de" required className={inputCls} />
      </div>
      <div className="min-w-40">
        <label className="mb-1 block text-xs font-medium text-muted">{t("parent")}</label>
        <select name="parent_id" defaultValue="" className={inputCls}>
          <option value="">{t("topLevelOption")}</option>
          {parentOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name_de}</option>
          ))}
        </select>
      </div>
      <div className="w-20">
        <label className="mb-1 block text-xs font-medium text-muted">{t("sortOrder")}</label>
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} />
      </div>
      <input type="hidden" name="is_active" value="on" />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "…" : t("addCategory")}
      </button>
      {state.error && <span className="w-full text-sm text-accent">{state.error}</span>}
    </form>
  );
}
