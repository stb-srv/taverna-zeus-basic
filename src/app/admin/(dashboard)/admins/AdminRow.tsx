"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { changeAdminPassword, type State } from "../../user-actions";
import { removeAdmin } from "@/app/admin/actions/admins";
import { inputCls, btnGhost, btnDanger } from "../ui";

const initial: State = {};

export default function AdminRow({
  email,
  isSelf,
  canManagePasswords,
}: {
  email: string;
  isSelf: boolean;
  canManagePasswords: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(changeAdminPassword, initial);
  const t = useTranslations("admin.admins");
  const tc = useTranslations("admin.common");

  return (
    <li className="p-3">
      <div className="flex items-center gap-3">
        <span className="flex-1 font-medium">
          {email}
          {isSelf && <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-muted">{t("you")}</span>}
        </span>

        {canManagePasswords && (
          <button type="button" onClick={() => setOpen((v) => !v)} className={btnGhost}>
            {t("changePassword")}
          </button>
        )}

        {isSelf ? (
          <span className="text-xs text-muted">{t("notRemovable")}</span>
        ) : (
          <form action={removeAdmin}>
            <input type="hidden" name="email" value={email} />
            <button type="submit" className={btnDanger}>{t("remove")}</button>
          </form>
        )}
      </div>

      {open && canManagePasswords && (
        <form action={action} className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <input type="hidden" name="email" value={email} />
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted">{t("newPasswordLabel")}</label>
            <input name="password" type="text" required minLength={8} className={inputCls} />
          </div>
          <button type="submit" disabled={pending} className={btnGhost}>
            {pending ? "…" : tc("save")}
          </button>
          {state.ok && <span className="text-sm text-primary">{t("changed")}</span>}
          {state.error && <span className="w-full text-sm text-accent">{state.error}</span>}
        </form>
      )}
    </li>
  );
}
