"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { login, type ActionState } from "../actions/admins";
import AdminLanguageSwitcher from "@/components/admin/AdminLanguageSwitcher";

const initial: ActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initial);
  const t = useTranslations("admin.login");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <AdminLanguageSwitcher />
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold to-accent text-lg font-bold text-white">
            Z
          </div>
          <h1 className="font-display text-2xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>

        <form action={formAction} className="card-soft space-y-4 p-6 hover:translate-y-0">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {state.error && <p className="text-sm text-accent">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
