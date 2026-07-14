"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateSettings, type ActionState } from "@/app/admin/actions/settings";
import { inputCls, labelCls, btnPrimary } from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import TranslationsPanel from "@/components/admin/TranslationsPanel";
import type { Database } from "@/lib/supabase/types";

type Settings = Database["public"]["Tables"]["restaurant_settings"]["Row"];
type I18n = Record<string, string>;
const initial: ActionState = {};

export default function SettingsForm({ settings }: { settings: Settings | null }) {
  const [state, action, pending] = useActionState(updateSettings, initial);
  const s = settings;
  const t = useTranslations("admin.settings");
  const tc = useTranslations("admin.common");

  return (
    <form action={action} className="max-w-2xl space-y-8">
      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">{t("generalHeading")}</h2>
        <div>
          <label className={labelCls}>{t("restaurantName")}</label>
          <input name="name" defaultValue={s?.name ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t("descriptionDe")}</label>
          <textarea name="description_de" defaultValue={s?.description_de ?? ""} rows={4} className={inputCls} />
        </div>
        <ImageUpload name="hero_image_url" bucket="site-images" defaultUrl={s?.hero_image_url} label={t("heroImage")} />
        <TranslationsPanel
          kind="settings"
          id={s ? String(s.id) : undefined}
          fields={[
            {
              name: "description",
              label: tc("description"),
              multiline: true,
              values: (s?.description_i18n as I18n) ?? {},
            },
          ]}
        />
      </section>

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">{t("addressHeading")}</h2>
        <div>
          <label className={labelCls}>{t("street")}</label>
          <input name="address_street" defaultValue={s?.address_street ?? ""} className={inputCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>{t("zip")}</label>
            <input name="address_zip" defaultValue={s?.address_zip ?? ""} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t("city")}</label>
            <input name="address_city" defaultValue={s?.address_city ?? ""} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>{t("country")}</label>
          <input name="address_country" defaultValue={s?.address_country ?? ""} className={inputCls} />
        </div>
      </section>

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">{t("contactHeading")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("phone")}</label>
            <input name="phone" defaultValue={s?.phone ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("email")}</label>
            <input name="email" type="email" defaultValue={s?.email ?? ""} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>{t("mapEmbed")}</label>
          <textarea name="google_maps_embed" defaultValue={s?.google_maps_embed ?? ""} rows={3} className={inputCls} />
          <p className="mt-1 text-xs text-muted">
            {t("mapEmbedHint")} <code>src=&quot;…&quot;</code> {t("mapEmbedHintSuffix")}
          </p>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tc("saving") : tc("save")}
        </button>
        {state.ok && <span className="text-sm text-primary">{tc("saved")}</span>}
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
