"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveAdditive, type ActionState } from "@/app/admin/actions/allergens";
import { inputCls, btnPrimary } from "@/components/admin/ui";

const initial: ActionState = {};

export default function AddAdditive() {
  const [state, action, pending] = useActionState(saveAdditive, initial);
  const t = useTranslations("admin.menu.allergens");
  return (
    <form action={action} className="card-soft flex flex-wrap items-end gap-3 p-4 hover:translate-y-0">
      <div className="w-20">
        <label className="mb-1 block text-xs font-medium text-muted">{t("code")}</label>
        <input name="code" required className={inputCls} />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">{t("nameDe")}</label>
        <input name="name_de" required className={inputCls} />
      </div>
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "…" : t("addAdditive")}
      </button>
      {state.error && <span className="w-full text-sm text-accent">{state.error}</span>}
    </form>
  );
}
