"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveItem, type ActionState } from "@/app/admin/actions/menu";
import { inputCls, labelCls, btnPrimary, btnGhost } from "../ui";
import ImageUpload from "../ImageUpload";
import TranslationsPanel from "../TranslationsPanel";
import type { Database } from "@/lib/supabase/types";

type I18n = Record<string, string>;

type Item = Database["public"]["Tables"]["menu_items"]["Row"];
type Category = Database["public"]["Tables"]["menu_categories"]["Row"];
type Label = { id: string; code: string; name_de: string };

const initial: ActionState = {};

export default function ItemForm({
  item,
  categories,
  allergens,
  additives,
  selectedAllergens,
  selectedAdditives,
}: {
  item: Item | null;
  categories: Category[];
  allergens: Label[];
  additives: Label[];
  selectedAllergens: string[];
  selectedAdditives: string[];
}) {
  const [state, action, pending] = useActionState(saveItem, initial);
  const t = useTranslations("admin.menu.item");
  const tc = useTranslations("admin.common");

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }

  return (
    <form action={action} className="max-w-2xl space-y-6">
      {item && <input type="hidden" name="id" value={item.id} />}

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className={labelCls}>{t("category")}</label>
            <select name="category_id" defaultValue={item?.category_id ?? categories[0]?.id} className={inputCls}>
              {topLevel.map((top) => {
                const kids = childrenByParent.get(top.id) ?? [];
                if (kids.length === 0) {
                  return <option key={top.id} value={top.id}>{top.name_de}</option>;
                }
                return (
                  <optgroup key={top.id} label={top.name_de}>
                    <option value={top.id}>{top.name_de} {t("generalOption")}</option>
                    {kids.map((k) => (
                      <option key={k.id} value={k.id}>{k.name_de}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <div className="w-28">
            <label className={labelCls}>{t("number")}</label>
            <input name="item_number" defaultValue={item?.item_number ?? ""} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{t("nameDe")}</label>
          <input name="name_de" defaultValue={item?.name_de ?? ""} required className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>{t("descriptionDe")}</label>
          <textarea name="description_de" defaultValue={item?.description_de ?? ""} rows={3} className={inputCls} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>{t("price")}</label>
            <input name="price" defaultValue={item?.price ?? ""} inputMode="decimal" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("sortOrder")}</label>
            <input name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={item?.is_active ?? true} />
            {t("activeVisible")}
          </label>
        </div>

        <ImageUpload name="image_url" bucket="menu-images" defaultUrl={item?.image_url} label={t("image")} />
      </section>

      <TranslationsPanel
        kind="item"
        id={item?.id}
        fields={[
          { name: "name", label: tc("name"), values: (item?.name_i18n as I18n) ?? {} },
          {
            name: "description",
            label: tc("description"),
            multiline: true,
            values: (item?.description_i18n as I18n) ?? {},
          },
        ]}
      />

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">{t("labelsTitle")}</h2>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("allergens")}</legend>
          <div className="flex flex-wrap gap-2">
            {allergens.map((a) => (
              <Checkbox key={a.id} name="allergens" value={a.id} defaultChecked={selectedAllergens.includes(a.id)}>
                {a.code} · {a.name_de}
              </Checkbox>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("additives")}</legend>
          <div className="flex flex-wrap gap-2">
            {additives.map((a) => (
              <Checkbox key={a.id} name="additives" value={a.id} defaultChecked={selectedAdditives.includes(a.id)}>
                {a.code} · {a.name_de}
              </Checkbox>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tc("saving") : tc("save")}
        </button>
        <Link href="/admin/menu" className={btnGhost}>{tc("cancel")}</Link>
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}

function Checkbox({
  name,
  value,
  defaultChecked,
  children,
}: {
  name: string;
  value: string;
  defaultChecked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft/40">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} />
      {children}
    </label>
  );
}
