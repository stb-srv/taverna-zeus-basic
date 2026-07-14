"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveAdditive, deleteAdditive, type ActionState } from "@/app/admin/actions/allergens";
import { inputCls, btnGhost, btnDanger } from "@/components/admin/ui";
import type { Database } from "@/lib/supabase/types";

type Additive = Database["public"]["Tables"]["additives"]["Row"];
const initial: ActionState = {};

export default function AdditiveRow({ additive }: { additive: Additive }) {
  const [state, action, pending] = useActionState(saveAdditive, initial);
  const t = useTranslations("admin.menu.allergens");
  const tc = useTranslations("admin.common");

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={additive.id} />
        <div className="w-20">
          <label className="mb-1 block text-xs font-medium text-muted">{t("code")}</label>
          <input name="code" defaultValue={additive.code} className={inputCls} />
        </div>
        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">{t("nameDe")}</label>
          <input name="name_de" defaultValue={additive.name_de} className={inputCls} />
        </div>
        <button type="submit" disabled={pending} className={btnGhost}>
          {pending ? "…" : tc("save")}
        </button>
        {state.ok && <span className="pb-2 text-xs text-primary">✓</span>}
        {state.error && <span className="w-full text-xs text-accent">{state.error}</span>}
      </form>
      <form
        action={deleteAdditive}
        onSubmit={(e) => {
          if (!confirm(t("deleteAdditiveConfirm"))) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={additive.id} />
        <button type="submit" className={btnDanger}>{tc("delete")}</button>
      </form>
    </div>
  );
}
