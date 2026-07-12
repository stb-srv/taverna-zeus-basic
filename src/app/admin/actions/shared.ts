import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { autofillI18n, type I18nMap } from "@/lib/i18n-fields";

export type ActionState = { ok?: boolean; error?: string };

export type TranslatableTable = "menu_items" | "menu_categories" | "pages" | "restaurant_settings";

/** Supabase client as returned by `guard()`. */
export type AdminClient = Awaited<ReturnType<typeof createClient>>;

/** Asserts an authenticated admin session and returns a Supabase client. */
export async function guard(): Promise<AdminClient> {
  const user = await getUser();
  if (!user) throw new Error("Nicht angemeldet");
  return createClient();
}

/** Refresh the public site after a content change. */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}

/**
 * Computes translations for the given fields (DE = source) and writes the
 * resulting `<field>_i18n` JSONB back to the row. Non-fatal: on any translation
 * error the source/existing values are kept. `overwrite` regenerates the
 * machine locales (used by the "re-translate" action).
 */
export async function fillTranslations(
  supabase: AdminClient,
  table: TranslatableTable,
  id: string | number,
  fields: Record<string, { i18n: I18nMap; source: string }>,
  overwrite = false,
): Promise<void> {
  const { result } = await autofillI18n(fields, { overwrite });
  const patch: Record<string, I18nMap> = {};
  for (const name of Object.keys(fields)) patch[`${name}_i18n`] = result[name];
  await supabase
    .from(table)
    .update(patch as never)
    .eq("id", id as never);
}
