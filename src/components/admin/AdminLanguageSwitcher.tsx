"use client";

import { useLocale, useTranslations } from "next-intl";
import { setAdminLocale } from "@/app/admin/actions/admin-locale";
import { localeNames, type Locale } from "@/i18n/routing";
import { useEnabledLocales } from "./EnabledLocalesContext";

/** Switches the admin UI's own display language, independent of site content. */
export default function AdminLanguageSwitcher() {
  const locales = useEnabledLocales();
  const current = useLocale() as Locale;
  const t = useTranslations("admin.nav");

  return (
    <form action={setAdminLocale}>
      <select
        key={current}
        name="locale"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label={t("languageLabel")}
        className="cursor-pointer rounded-lg border border-border bg-card px-2 py-1 text-sm outline-none transition hover:bg-accent-soft/60"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </form>
  );
}
