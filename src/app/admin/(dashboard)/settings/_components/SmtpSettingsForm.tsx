"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateSmtpSettings, testSmtpConnection, type ActionState } from "@/app/admin/actions/smtp";
import { inputCls, labelCls, btnPrimary, btnGhost } from "@/components/admin/ui-classes";

// Bewusst ohne das echte Passwort (siehe page.tsx) — nur ein Bool-Flag, ob eines gesetzt ist.
export type SmtpSettings = {
  host: string | null;
  port: number | null;
  username: string | null;
  from_address: string | null;
  notify_email: string | null;
  hasPassword: boolean;
};
const initial: ActionState = {};

export default function SmtpSettingsForm({ settings }: { settings: SmtpSettings | null }) {
  const [saveState, saveAction, savePending] = useActionState(updateSmtpSettings, initial);
  const [testState, testAction, testPending] = useActionState(testSmtpConnection, initial);
  const t = useTranslations("admin.settings");
  const tc = useTranslations("admin.common");
  const s = settings;

  return (
    <section className="card-soft max-w-2xl space-y-4 p-6 hover:translate-y-0">
      <div>
        <h2 className="font-display text-lg">{t("smtpHeading")}</h2>
        <p className="mt-1 text-xs text-muted">{t("smtpHint")}</p>
      </div>

      <form action={saveAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("smtpHost")} *</label>
            <input name="host" defaultValue={s?.host ?? ""} placeholder="mail.example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("smtpPort")}</label>
            <input
              name="port"
              type="number"
              defaultValue={s?.port ?? ""}
              placeholder="587"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("smtpUser")}</label>
            <input name="username" defaultValue={s?.username ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("smtpPassword")}</label>
            <input
              name="password"
              type="password"
              placeholder={s?.hasPassword ? t("smtpPasswordUnchangedHint") : ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("smtpFrom")}</label>
            <input name="from_address" type="email" defaultValue={s?.from_address ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("smtpNotifyEmail")} *</label>
            <input name="notify_email" type="email" defaultValue={s?.notify_email ?? ""} className={inputCls} />
            <p className="mt-1 text-xs text-muted">{t("smtpNotifyEmailHint")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={savePending} className={btnPrimary}>
            {savePending ? tc("saving") : tc("save")}
          </button>
          {saveState.ok && <span className="text-sm text-primary">{tc("saved")}</span>}
          {saveState.error && <span className="text-sm text-accent">{saveState.error}</span>}
        </div>
      </form>

      <form action={testAction} className="border-t border-foreground/10 pt-4">
        <div className="flex items-center gap-4">
          <button type="submit" disabled={testPending} className={btnGhost}>
            {testPending ? t("smtpTesting") : t("smtpTestButton")}
          </button>
          {testState.ok && <span className="text-sm text-primary">{t("smtpTestSuccess")}</span>}
          {testState.error && <span className="text-sm text-accent">{testState.error}</span>}
        </div>
      </form>
    </section>
  );
}
