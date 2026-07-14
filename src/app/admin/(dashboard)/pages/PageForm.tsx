"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { savePage, type ActionState } from "@/app/admin/actions/pages";
import { inputCls, labelCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import TranslationsPanel from "@/components/admin/TranslationsPanel";
import type { Database } from "@/lib/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];
type I18n = Record<string, string>;
const initial: ActionState = {};

export default function PageForm({ page }: { page: Page | null }) {
  const [state, action, pending] = useActionState(savePage, initial);
  const t = useTranslations("admin.pages");
  const tc = useTranslations("admin.common");

  return (
    <form action={action} className="max-w-2xl space-y-6">
      {page && <input type="hidden" name="id" value={page.id} />}

      <section className="card-soft space-y-4 p-6 hover:translate-y-0">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className={labelCls}>{t("slug")}</label>
            <input
              name="slug"
              defaultValue={page?.slug ?? ""}
              placeholder={t("slugPlaceholder")}
              required
              className={inputCls}
            />
          </div>
          <div className="w-28">
            <label className={labelCls}>{t("sortOrder")}</label>
            <input name="sort_order" type="number" defaultValue={page?.sort_order ?? 0} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{t("titleDe")}</label>
          <input name="title_de" defaultValue={page?.title_de ?? ""} required className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>{t("contentDe")}</label>
          <textarea name="content_de" defaultValue={page?.content_de ?? ""} rows={10} className={`${inputCls} font-mono text-xs`} />
        </div>
        <p className="text-xs text-muted">
          {t("markdownHint")} <code>## Überschrift</code>, <code>### Unterüberschrift</code>, <code>**fett**</code>, {t("markdownHintSuffix")}
        </p>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={page?.is_published ?? false} />
            {t("published")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="show_in_nav" defaultChecked={page?.show_in_nav ?? false} />
            {t("showInNav")}
          </label>
        </div>
      </section>

      <TranslationsPanel
        kind="page"
        id={page?.id}
        fields={[
          { name: "title", label: t("titleField"), values: (page?.title_i18n as I18n) ?? {} },
          {
            name: "content",
            label: t("contentField"),
            multiline: true,
            values: (page?.content_i18n as I18n) ?? {},
          },
        ]}
      />

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? tc("saving") : tc("save")}
        </button>
        <Link href="/admin/pages" className={btnGhost}>{tc("cancel")}</Link>
        {state.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
