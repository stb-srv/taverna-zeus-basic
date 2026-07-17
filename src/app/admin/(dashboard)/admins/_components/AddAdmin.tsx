"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createAdminUser, type ActionState } from "../../../actions/admins";
import { inputCls, btnPrimary } from "@/components/admin/ui-classes";

const initial: ActionState = {};

export default function AddAdmin({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(createAdminUser, initial);
  const t = useTranslations("admin.admins");
  return (
    <form action={action} className="card-soft space-y-3 p-4 hover:translate-y-0">
      <h2 className="font-display text-lg">{t("addNewTitle")}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">{t("email")}</label>
          <input name="email" type="email" required disabled={disabled} placeholder="name@example.com" className={inputCls} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">{t("passwordLabel")}</label>
          <input name="password" type="text" required minLength={8} disabled={disabled} className={inputCls} />
        </div>
        <button type="submit" disabled={pending || disabled} className={btnPrimary}>
          {pending ? "…" : t("create")}
        </button>
      </div>
      <p className="text-xs text-muted">{t("createHint")}</p>
      {state.ok && <span className="text-sm text-primary">{t("created")}</span>}
      {state.error && <span className="text-sm text-accent">{state.error}</span>}
    </form>
  );
}
