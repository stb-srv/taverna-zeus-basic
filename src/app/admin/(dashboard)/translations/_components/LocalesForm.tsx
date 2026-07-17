"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { routing, localeNames, type Locale } from "@/i18n/routing";
import {
  updateEnabledLocales,
  type LocalesState,
} from "@/app/admin/actions/translations";
import { btnPrimary } from "@/components/admin/ui-classes";

const initial: LocalesState = {};

/** Checkbox grid to activate/deactivate website languages. */
export default function LocalesForm({ enabled }: { enabled: Locale[] }) {
  const [state, action, pending] = useActionState(updateEnabledLocales, initial);
  const t = useTranslations("admin.localesForm");

  return (
    <form action={action}>
      {/* Disabled checkboxes are not submitted — DE is always active. */}
      <input type="hidden" name="locales" value={routing.defaultLocale} />
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {routing.locales.map((loc) => (
          <label
            key={loc}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm ${
              loc === routing.defaultLocale ? "opacity-60" : "hover:bg-accent-soft/40"
            }`}
          >
            <input
              type="checkbox"
              name="locales"
              value={loc}
              defaultChecked={enabled.includes(loc)}
              disabled={loc === routing.defaultLocale}
              className="accent-primary"
            />
            <span className="min-w-0 truncate">{localeNames[loc]}</span>
            <span className="ml-auto text-[0.68rem] font-semibold uppercase text-muted">{loc}</span>
          </label>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">{t("hint")}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? t("submitting") : t("submit")}
        </button>
        {state.ok && <span className="text-sm text-primary">{state.info} ✓</span>}
        {state.error && (
          <span className="text-sm text-accent">
            {state.info ? `${state.info} — ` : ""}{t("errorPrefix")} {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
