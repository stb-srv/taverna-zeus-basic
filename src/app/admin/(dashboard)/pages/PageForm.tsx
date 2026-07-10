"use client";

import Link from "next/link";
import { useActionState } from "react";
import { savePage, type ActionState } from "../../actions";
import { inputCls, labelCls, btnPrimary, btnGhost } from "../ui";
import TranslationsPanel from "../TranslationsPanel";
import type { Database } from "@/lib/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];
type I18n = Record<string, string>;
const initial: ActionState = {};

export default function PageForm({ page }: { page: Page | null }) {
  const [state, action, pending] = useActionState(savePage, initial);

  return (
    <form action={action} className="max-w-2xl space-y-6">
      {page && <input type="hidden" name="id" value={page.id} />}

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className={labelCls}>Slug (URL)</label>
            <input
              name="slug"
              defaultValue={page?.slug ?? ""}
              placeholder="z. B. ueber-uns"
              required
              className={inputCls}
            />
          </div>
          <div className="w-28">
            <label className={labelCls}>Reihenfolge</label>
            <input name="sort_order" type="number" defaultValue={page?.sort_order ?? 0} className={inputCls} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Titel (DE)</label>
            <input name="title_de" defaultValue={page?.title_de ?? ""} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Titel (EN)</label>
            <input name="title_en" defaultValue={page?.title_en ?? ""} required className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Inhalt (DE) — Markdown</label>
          <textarea name="content_de" defaultValue={page?.content_de ?? ""} rows={10} className={`${inputCls} font-mono text-xs`} />
        </div>
        <div>
          <label className={labelCls}>Inhalt (EN) — Markdown</label>
          <textarea name="content_en" defaultValue={page?.content_en ?? ""} rows={10} className={`${inputCls} font-mono text-xs`} />
        </div>
        <p className="text-xs text-muted">
          Markdown: <code>## Überschrift</code>, <code>### Unterüberschrift</code>, <code>**fett**</code>, Leerzeile = neuer Absatz.
        </p>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={page?.is_published ?? false} />
            veröffentlicht
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="show_in_nav" defaultChecked={page?.show_in_nav ?? false} />
            im Menü anzeigen
          </label>
        </div>
      </section>

      <TranslationsPanel
        kind="page"
        id={page?.id}
        fields={[
          { name: "title", label: "Titel", values: (page?.title_i18n as I18n) ?? {} },
          {
            name: "content",
            label: "Inhalt (Markdown)",
            multiline: true,
            values: (page?.content_i18n as I18n) ?? {},
          },
        ]}
      />

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Speichern …" : "Speichern"}
        </button>
        <Link href="/admin/pages" className={btnGhost}>Abbrechen</Link>
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
