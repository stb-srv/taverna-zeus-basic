import { DEFAULT_ENABLED_LOCALES, type Locale } from "./routing";
import { getUiMessages } from "@/lib/locales";
import { mergeMessages, type MessageTree } from "@/lib/ui-messages";
import deMessages from "../../messages/de.json";

/**
 * Resolves the full message tree for a locale: the bundled static file for
 * `DEFAULT_ENABLED_LOCALES`, or the DB-stored machine-translation overlay
 * merged over the German base for any locale enabled beyond that set. Shared
 * by the public `[locale]` request config and the admin area's cookie-driven
 * locale resolution, so both read messages the exact same way.
 */
export async function resolveMessages(locale: Locale): Promise<MessageTree> {
  if ((DEFAULT_ENABLED_LOCALES as readonly string[]).includes(locale)) {
    return (await import(`../../messages/${locale}.json`)).default;
  }
  const dbMessages = await getUiMessages(locale);
  return mergeMessages(deMessages as MessageTree, dbMessages);
}
