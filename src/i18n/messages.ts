import { routing, type Locale } from "./routing";
import { getUiMessages } from "@/i18n/locale-state";
import { mergeMessages, type MessageTree } from "@/i18n/ui-messages";
import { readMessagesCache, writeMessagesCache } from "@/i18n/ui-messages-cache";
import deMessages from "../../messages/de.json";

/**
 * Resolves the full message tree for a locale. German is the only bundled
 * file and needs no lookup; every other locale is machine-translated and
 * stored in `restaurant_settings.ui_messages`, merged over the German base
 * so any still-missing key renders in German rather than blank.
 *
 * If Supabase itself is unreachable (not just "locale not yet translated"),
 * this falls back to the last successful on-disk snapshot for that locale
 * (see ui-messages-cache.ts) instead of silently collapsing every visitor to
 * German. Shared by the public `[locale]` request config and the admin
 * area's cookie-driven locale resolution, so both read messages the exact
 * same way.
 */
export async function resolveMessages(locale: Locale): Promise<MessageTree> {
  const base = deMessages as MessageTree;
  if (locale === routing.defaultLocale) return base;

  const { messages: dbMessages, ok } = await getUiMessages(locale);
  if (ok) {
    const merged = mergeMessages(base, dbMessages);
    await writeMessagesCache(locale, merged);
    return merged;
  }

  console.error(`UI-Messages: Supabase nicht erreichbar für "${locale}", nutze Cache-Fallback.`);
  const cached = await readMessagesCache(locale);
  return cached ?? base;
}
