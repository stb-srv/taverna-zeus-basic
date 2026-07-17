"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveAllergen, deleteAllergen, type ActionState } from "@/app/admin/actions/allergens";
import { inputCls, btnGhost, btnDanger } from "@/components/admin/ui-classes";
import type { Database } from "@/lib/supabase/types";

type Allergen = Database["public"]["Tables"]["allergens"]["Row"];
const initial: ActionState = {};

export default function AllergenRow({ allergen }: { allergen: Allergen }) {
  const [state, action, pending] = useActionState(saveAllergen, initial);
  const t = useTranslations("admin.menu.allergens");
  const tc = useTranslations("admin.common");

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={allergen.id} />
        <div className="w-20">
          <label className="mb-1 block text-xs font-medium text-muted">{t("code")}</label>
          <input name="code" defaultValue={allergen.code} className={inputCls} />
        </div>
        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">{t("nameDe")}</label>
          <input name="name_de" defaultValue={allergen.name_de} className={inputCls} />
        </div>
        <button type="submit" disabled={pending} className={btnGhost}>
          {pending ? "…" : tc("save")}
        </button>
        {state.ok && <span className="pb-2 text-xs text-primary">✓</span>}
        {state.error && <span className="w-full text-xs text-accent">{state.error}</span>}
      </form>
      <form
        action={deleteAllergen}
        onSubmit={(e) => {
          if (!confirm(t("deleteAllergenConfirm"))) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={allergen.id} />
        <button type="submit" className={btnDanger}>{tc("delete")}</button>
      </form>
    </div>
  );
}
