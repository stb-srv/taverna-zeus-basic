"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { updateSettings, type ActionState } from "@/app/admin/actions/settings";
import { SOCIAL_PLATFORMS, type SocialPlatform, type SocialLinks } from "@/lib/social-platforms";
import { getBerlinToday, isWithinClosureWindow } from "@/lib/closure-window";
import { inputCls, labelCls, btnPrimary } from "@/components/admin/ui-classes";
import ImageUpload from "@/components/admin/ImageUpload";
import TranslationsPanel from "@/components/admin/TranslationsPanel";
import type { Database } from "@/lib/supabase/types";
import type { Tab } from "./SettingsTabs";

type Settings = Database["public"]["Tables"]["restaurant_settings"]["Row"];
type I18n = Record<string, string>;
const initial: ActionState = {};

const PLATFORM_INPUT_TYPE: Record<SocialPlatform, "url" | "tel"> = {
  instagram: "url",
  facebook: "url",
  tiktok: "url",
  whatsapp: "tel",
};

export default function SettingsForm({ settings, activeTab }: { settings: Settings | null; activeTab: Tab }) {
  const [state, action, pending] = useActionState(updateSettings, initial);
  const s = settings;
  const t = useTranslations("admin.settings");
  const tc = useTranslations("admin.common");

  // Reaktiver Live-Status des Urlaubs-Banners: zeigt sofort, ob er aktuell
  // sichtbar ist bzw. wann er automatisch erscheint/verschwindet — verhindert
  // die Verwechslung zwischen dem im Text genannten Datum und dem „bis\"-Feld.
  const [closureEnabled, setClosureEnabled] = useState(s?.closure_banner_enabled ?? false);
  const [closureFrom, setClosureFrom] = useState(s?.closure_banner_from ?? "");
  const [closureUntil, setClosureUntil] = useState(s?.closure_banner_until ?? "");

  function formatDate(iso: string): string {
    const [y, m, d] = iso.split("-");
    return d && m && y ? `${d}.${m}.${y}` : iso;
  }

  function closureStatus(): { text: string; active: boolean } {
    if (!closureEnabled) return { text: t("closureStatusDisabled"), active: false };
    if (!closureFrom || !closureUntil) return { text: t("closureStatusIncomplete"), active: false };
    const today = getBerlinToday();
    if (today < closureFrom)
      return { text: t("closureStatusScheduled", { date: formatDate(closureFrom) }), active: false };
    if (isWithinClosureWindow(today, closureFrom, closureUntil))
      return { text: t("closureStatusVisible", { date: formatDate(closureUntil) }), active: true };
    return { text: t("closureStatusExpired"), active: false };
  }

  const closure = closureStatus();

  return (
    <form action={action} className="max-w-2xl space-y-8">
      <div className={`space-y-8 ${activeTab === "location" ? "" : "hidden"}`}>
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
      </div>

      <div className={activeTab === "social" ? "" : "hidden"}>
        <section className="card-soft space-y-4 p-6 hover:translate-y-0">
          <h2 className="font-display text-lg">{t("socialHeading")}</h2>
          {SOCIAL_PLATFORMS.map((platform) => {
            const entry = (s?.social_links as SocialLinks | null)?.[platform];
            return (
              <div key={platform} className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <label className={labelCls}>{t(platform)}</label>
                  <input
                    name={`social_${platform}_url`}
                    type={PLATFORM_INPUT_TYPE[platform]}
                    defaultValue={entry?.url ?? ""}
                    className={inputCls}
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    name={`social_${platform}_enabled`}
                    defaultChecked={entry?.enabled ?? false}
                  />
                  {t("enabled")}
                </label>
              </div>
            );
          })}
        </section>
      </div>

      <div className={activeTab === "closure" ? "" : "hidden"}>
        <section className="card-soft space-y-4 p-6 hover:translate-y-0">
          <h2 className="font-display text-lg">{t("closureBannerHeading")}</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="closure_banner_enabled"
              checked={closureEnabled}
              onChange={(e) => setClosureEnabled(e.target.checked)}
            />
            {t("closureBannerEnabled")}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("closureBannerFrom")}</label>
              <input
                type="date"
                name="closure_banner_from"
                value={closureFrom}
                onChange={(e) => setClosureFrom(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{t("closureBannerUntil")}</label>
              <input
                type="date"
                name="closure_banner_until"
                value={closureUntil}
                onChange={(e) => setClosureUntil(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              closure.active ? "bg-primary/10 text-primary" : "bg-accent-soft text-muted"
            }`}
          >
            {closure.text}
          </p>
          <div>
            <label className={labelCls}>{t("closureBannerMessageDe")}</label>
            <textarea
              name="closure_banner_message_de"
              defaultValue={s?.closure_banner_message_de ?? ""}
              rows={3}
              className={inputCls}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{t("closureBannerHint")}</p>
          <TranslationsPanel
            kind="settings"
            id={s ? String(s.id) : undefined}
            fields={[
              {
                name: "closure_banner_message",
                label: t("closureBannerMessageDe"),
                multiline: true,
                values: (s?.closure_banner_message_i18n as I18n) ?? {},
              },
            ]}
          />
        </section>
      </div>

      {activeTab !== "smtp" && (
        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? tc("saving") : tc("save")}
          </button>
          {state.ok && <span className="text-sm text-primary">{tc("saved")}</span>}
          {state.error && <span className="text-sm text-accent">{state.error}</span>}
        </div>
      )}
    </form>
  );
}
