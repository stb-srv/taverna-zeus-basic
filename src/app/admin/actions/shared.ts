import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { autofillI18n, type I18nMap } from "@/i18n/fields";
import { getEnabledLocales } from "@/i18n/locale-state";

export type ActionState = { ok?: boolean; error?: string };

export type TranslatableTable =
  | "menu_items"
  | "menu_categories"
  | "pages"
  | "restaurant_settings"
  | "allergens"
  | "additives"
  | "reviews"
  | "gallery_images";

/** Supabase client as returned by `guard()`. */
export type AdminClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Asserts an authenticated **admin** session and returns a Supabase client.
 * Checks membership in the `admins` allowlist — not merely that someone is
 * logged in — so it is safe even for tables whose RLS is not itself gated on
 * `is_admin()` (e.g. `contact_messages`). Throws (rather than redirecting) so
 * callers can surface the error via their `ActionState` return.
 */
export async function guard(): Promise<AdminClient> {
  const user = await getUser();
  if (!user) throw new Error("Nicht angemeldet");
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", (user.email ?? "").toLowerCase())
    .maybeSingle();
  if (!data) throw new Error("Keine Admin-Berechtigung.");
  return supabase;
}

/** Refresh the public site after a content change. */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}

/**
 * Computes translations for the given fields (DE = source) and writes the
 * resulting `<field>_i18n` JSONB back to the row. The legacy `<field>_en`
 * column is synced from the map, so a blank EN form field ends up with the
 * machine translation. Non-fatal: on any translation error the
 * source/existing values are kept. `overwrite` regenerates the machine
 * locales (used by the "re-translate" action).
 */
export async function fillTranslations(
  supabase: AdminClient,
  table: TranslatableTable,
  id: string | number,
  fields: Record<string, { i18n: I18nMap; source: string }>,
  overwrite = false,
): Promise<void> {
  const { result } = await autofillI18n(fields, { overwrite, targets: await getEnabledLocales() });
  const patch: Record<string, I18nMap | string> = {};
  for (const name of Object.keys(fields)) {
    patch[`${name}_i18n`] = result[name];
    const en = result[name].en;
    if (typeof en === "string" && en.trim()) patch[`${name}_en`] = en;
  }
  await supabase
    .from(table)
    .update(patch as never)
    .eq("id", id as never);
}
