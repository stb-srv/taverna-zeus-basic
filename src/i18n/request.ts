import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { DEFAULT_ENABLED_LOCALES, routing } from "./routing";
import { getEnabledLocales, getUiMessages } from "@/lib/locales";
import { mergeMessages, type MessageTree } from "@/lib/ui-messages";
import deMessages from "../../messages/de.json";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const enabled = await getEnabledLocales();
  const locale =
    hasLocale(routing.locales, requested) && enabled.includes(requested)
      ? requested
      : routing.defaultLocale;

  // The default set ships with bundled message files; additionally enabled
  // locales use DB-stored machine translations, falling back to German for
  // anything missing.
  if ((DEFAULT_ENABLED_LOCALES as readonly string[]).includes(locale)) {
    return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
  }
  const dbMessages = await getUiMessages(locale);
  return { locale, messages: mergeMessages(deMessages as MessageTree, dbMessages) as never };
});
