"use client";

import { useTranslations } from "next-intl";
import { localeNames, rtlLocales } from "@/i18n/routing";
import { retranslate } from "@/app/admin/actions/translations";
import { useEnabledLocales } from "../EnabledLocalesContext";
import { inputCls, btnGhost } from "./ui";

export type TranslField = {
  /** Field base name, e.g. "name" → inputs are submitted as `name_<locale>`. */
  name: string;
  label: string;
  multiline?: boolean;
  /** Current per-locale values (`<field>_i18n` JSONB from the row). */
  values: Record<string, string>;
};

/**
 * Collapsible editor for every machine-translated locale (everything except
 * the DE source). Fields submit as `<field>_<locale>` and are picked up by the
 * save action; values entered here are preserved (auto-fill only touches
 * empty locales). The "re-translate" button regenerates them.
 */
export default function TranslationsPanel({
  fields,
  kind,
  id,
}: {
  fields: TranslField[];
  kind?: "item" | "category" | "page" | "settings";
  id?: string;
}) {
  const langs = useEnabledLocales().filter((l) => l !== "de");
  const t = useTranslations("admin.translationsPanel");

  return (
    <details className="card-soft p-6 hover:translate-y-0">
      <summary className="cursor-pointer select-none font-display text-lg">
        {t("title")} <span className="text-sm text-muted">{t("subtitle")}</span>
      </summary>
      <p className="mt-2 text-sm text-muted">{t("description")}</p>

      <div className="mt-4 space-y-6">
        {langs.map((loc) => (
          <div key={loc}>
            <h3 className="mb-2 text-sm font-semibold">
              {localeNames[loc]} <span className="uppercase text-muted">· {loc}</span>
            </h3>
            <div
              className="grid gap-3 sm:grid-cols-2"
              dir={rtlLocales.includes(loc) ? "rtl" : undefined}
            >
              {fields.map((f) =>
                f.multiline ? (
                  <textarea
                    key={f.name}
                    name={`${f.name}_${loc}`}
                    defaultValue={f.values[loc] ?? ""}
                    rows={2}
                    placeholder={f.label}
                    className={inputCls}
                  />
                ) : (
                  <input
                    key={f.name}
                    name={`${f.name}_${loc}`}
                    defaultValue={f.values[loc] ?? ""}
                    placeholder={f.label}
                    className={inputCls}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {kind && id && (
        <div className="mt-5">
          <input type="hidden" name="kind" value={kind} />
          <button type="submit" formAction={retranslate} formNoValidate className={btnGhost}>
            {t("retranslate")}
          </button>
        </div>
      )}
    </details>
  );
}
