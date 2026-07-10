"use client";

import { useActionState } from "react";
import { updateSettings, type ActionState } from "../../actions";
import { inputCls, labelCls, btnPrimary } from "../ui";
import ImageUpload from "../ImageUpload";
import TranslationsPanel from "../TranslationsPanel";
import type { Database } from "@/lib/supabase/types";

type Settings = Database["public"]["Tables"]["restaurant_settings"]["Row"];
type I18n = Record<string, string>;
const initial: ActionState = {};

export default function SettingsForm({ settings }: { settings: Settings | null }) {
  const [state, action, pending] = useActionState(updateSettings, initial);
  const s = settings;

  return (
    <form action={action} className="max-w-2xl space-y-8">
      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">Allgemein</h2>
        <div>
          <label className={labelCls}>Name des Restaurants</label>
          <input name="name" defaultValue={s?.name ?? ""} className={inputCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Beschreibung (DE)</label>
            <textarea name="description_de" defaultValue={s?.description_de ?? ""} rows={4} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Beschreibung (EN)</label>
            <textarea name="description_en" defaultValue={s?.description_en ?? ""} rows={4} className={inputCls} />
          </div>
        </div>
        <ImageUpload name="hero_image_url" bucket="site-images" defaultUrl={s?.hero_image_url} label="Hero-Bild" />
        <TranslationsPanel
          kind="settings"
          id={s ? String(s.id) : undefined}
          fields={[
            {
              name: "description",
              label: "Beschreibung",
              multiline: true,
              values: (s?.description_i18n as I18n) ?? {},
            },
          ]}
        />
      </section>

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">Adresse</h2>
        <div>
          <label className={labelCls}>Straße & Nr.</label>
          <input name="address_street" defaultValue={s?.address_street ?? ""} className={inputCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>PLZ</label>
            <input name="address_zip" defaultValue={s?.address_zip ?? ""} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Ort</label>
            <input name="address_city" defaultValue={s?.address_city ?? ""} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Land</label>
          <input name="address_country" defaultValue={s?.address_country ?? ""} className={inputCls} />
        </div>
      </section>

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <h2 className="font-display text-lg">Kontakt & Karte</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Telefon</label>
            <input name="phone" defaultValue={s?.phone ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>E-Mail</label>
            <input name="email" type="email" defaultValue={s?.email ?? ""} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Google-Maps Embed-URL</label>
          <textarea name="google_maps_embed" defaultValue={s?.google_maps_embed ?? ""} rows={3} className={inputCls} />
          <p className="mt-1 text-xs text-muted">
            In Google Maps: „Teilen" → „Karte einbetten" → nur die URL aus dem <code>src=&quot;…&quot;</code> einfügen.
          </p>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Speichern …" : "Speichern"}
        </button>
        {state.ok && <span className="text-sm text-primary">Gespeichert ✓</span>}
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
