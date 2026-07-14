import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { getEnabledLocales } from "@/lib/locales";
import { resolveMessages } from "./messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const enabled = await getEnabledLocales();
  const locale =
    hasLocale(routing.locales, requested) && enabled.includes(requested)
      ? requested
      : routing.defaultLocale;

  return { locale, messages: (await resolveMessages(locale)) as never };
});
