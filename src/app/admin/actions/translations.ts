"use server";

import { revalidatePath } from "next/cache";
import type { I18nMap } from "@/lib/i18n-fields";
import { str } from "@/lib/form-data";
import {
  fillTranslations,
  guard,
  revalidatePublic,
  type TranslatableTable,
} from "./shared";

const RETRANSLATE_FIELDS: Record<string, { table: TranslatableTable; fields: string[] }> = {
  item: { table: "menu_items", fields: ["name", "description"] },
  category: { table: "menu_categories", fields: ["name", "description"] },
  page: { table: "pages", fields: ["title", "content"] },
  settings: { table: "restaurant_settings", fields: ["description"] },
};

/** "Alle neu übersetzen": regenerates el/ru/pl/nl/ar/es from DE (DE/EN kept). */
export async function retranslate(fd: FormData) {
  const supabase = await guard();
  const cfg = RETRANSLATE_FIELDS[str(fd, "kind")];
  if (!cfg) return;
  const id: string | number = cfg.table === "restaurant_settings" ? 1 : str(fd, "id");

  const cols = cfg.fields.flatMap((f) => [`${f}_de`, `${f}_i18n`]).join(", ");
  const { data } = await supabase
    .from(cfg.table)
    .select(cols)
    .eq("id", id as never)
    .single();
  if (!data) return;
  const row = data as unknown as Record<string, unknown>;

  const fields: Record<string, { i18n: I18nMap; source: string }> = {};
  for (const f of cfg.fields) {
    fields[f] = {
      i18n: (row[`${f}_i18n`] ?? {}) as I18nMap,
      source: String(row[`${f}_de`] ?? ""),
    };
  }
  await fillTranslations(supabase, cfg.table, id, fields, true);
  revalidatePublic();
  revalidatePath("/admin", "layout");
}
