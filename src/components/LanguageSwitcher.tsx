"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, type Locale } from "@/i18n/routing";
import { useLocale } from "next-intl";

/** Compact dropdown to switch between all configured locales, staying on the page. */
export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const active = useLocale() as Locale;

  return (
    <select
      aria-label="Language"
      value={active}
      onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
      className="cursor-pointer rounded-lg border border-white/30 bg-white/10 px-2 py-1 text-sm font-medium text-white outline-none transition hover:bg-white/20 focus:border-white/60 [&>option]:text-foreground"
    >
      {routing.locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeNames[locale]}
        </option>
      ))}
    </select>
  );
}
