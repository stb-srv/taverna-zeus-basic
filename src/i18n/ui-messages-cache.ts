import "server-only";
import { readDiskCache, writeDiskCache } from "@/lib/disk-cache";
import type { MessageTree } from "@/i18n/ui-messages";

const NAMESPACE = "ui-messages";

/** Best-effort write-through snapshot, called after every successful DB read. */
export async function writeMessagesCache(locale: string, messages: MessageTree): Promise<void> {
  await writeDiskCache(NAMESPACE, locale, messages);
}

/** Last known-good snapshot for a locale, or null if none exists yet. */
export async function readMessagesCache(locale: string): Promise<MessageTree | null> {
  return readDiskCache<MessageTree>(NAMESPACE, locale);
}
