import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { deletePage } from "@/app/admin/actions/pages";
import { btnPrimary, btnGhost, btnDanger } from "../ui";

export default async function PagesAdminPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase.from("pages").select("*").order("sort_order");
  const t = await getTranslations("admin.pages");
  const tc = await getTranslations("admin.common");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link href="/admin/pages/new" className={btnPrimary}>{t("newPage")}</Link>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {(pages ?? []).map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3">
            <span className="flex-1 font-medium">
              {p.title_de}
              <span className="ml-2 text-xs text-muted">/{p.slug}</span>
              {!p.is_published && (
                <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-muted">{t("draft")}</span>
              )}
            </span>
            <Link href={`/admin/pages/${p.id}`} className={btnGhost}>{tc("edit")}</Link>
            <form action={deletePage}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className={btnDanger}>{tc("delete")}</button>
            </form>
          </li>
        ))}
        {(pages ?? []).length === 0 && (
          <li className="p-4 text-sm text-muted">{t("noPages")}</li>
        )}
      </ul>
    </div>
  );
}
