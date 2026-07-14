import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { getAdminLocale, getEnabledLocales } from "@/i18n/locale-state";
import { resolveMessages } from "./messages";

/**
 * `/admin` carries no `[locale]` URL segment (the i18n middleware skips it,
 * see `src/proxy.ts`), so `requestLocale` never resolves there — that's also
 * the *only* case where it fails to resolve, since every public route is
 * always locale-prefixed. Server Components under `/admin` call
 * `getTranslations()` (next-intl/server), which reads its locale from here,
 * not from the `NextIntlClientProvider` props the admin root layout sets up
 * for Client Components — so without this fallback, every server-rendered
 * admin string stayed German regardless of the admin-locale cookie.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const enabled = await getEnabledLocales();
  const locale =
    hasLocale(routing.locales, requested) && enabled.includes(requested)
      ? requested
      : await getAdminLocale();

  return { locale, messages: (await resolveMessages(locale)) as never };
});
