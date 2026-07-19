import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { markAsRead, deleteMessage, clearSpamLog } from "@/app/admin/actions/messages";
import { btnGhost, btnDanger } from "@/components/admin/ui-classes";

export default async function MessagesAdminPage() {
  const supabase = await createClient();
  const [{ data: messages }, { count: honeypotCount }, { count: tooFastCount }] = await Promise.all([
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
    supabase.from("spam_blocks").select("id", { count: "exact", head: true }).eq("reason", "honeypot"),
    supabase.from("spam_blocks").select("id", { count: "exact", head: true }).eq("reason", "too_fast"),
  ]);
  const spamTotal = (honeypotCount ?? 0) + (tooFastCount ?? 0);
  const t = await getTranslations("admin.messages");
  const tc = await getTranslations("admin.common");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <ul className="space-y-3">
        {(messages ?? []).map((m) => (
          <li
            key={m.id}
            className={`card-soft space-y-2 p-4 hover:translate-y-0 ${m.read_at ? "" : "border-l-4 border-l-primary"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 text-sm text-muted">{m.email}</span>
                {m.phone && <span className="ml-2 text-sm text-muted">· {m.phone}</span>}
              </div>
              <span className="text-xs text-muted">
                {new Date(m.created_at).toLocaleString("de-DE")}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground/80">{m.message}</p>
            <div className="flex gap-3">
              {!m.read_at && (
                <form action={markAsRead}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className={btnGhost}>
                    {t("markAsRead")}
                  </button>
                </form>
              )}
              <form action={deleteMessage}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className={btnDanger}>
                  {tc("delete")}
                </button>
              </form>
            </div>
          </li>
        ))}
        {(messages ?? []).length === 0 && (
          <li className="p-4 text-sm text-muted">{t("noMessages")}</li>
        )}
      </ul>

      <div className="mt-10">
        <h2 className="font-display text-xl">{t("spamTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("spamSubtitle", { count: spamTotal })}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
          <div className="card-soft p-4 hover:translate-y-0">
            <div className="text-2xl font-semibold">{honeypotCount ?? 0}</div>
            <div className="text-xs text-muted">{t("spamReasonHoneypot")}</div>
          </div>
          <div className="card-soft p-4 hover:translate-y-0">
            <div className="text-2xl font-semibold">{tooFastCount ?? 0}</div>
            <div className="text-xs text-muted">{t("spamReasonTooFast")}</div>
          </div>
        </div>
        {spamTotal > 0 && (
          <form action={clearSpamLog} className="mt-4">
            <button type="submit" className={btnGhost}>
              {t("spamClear")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
