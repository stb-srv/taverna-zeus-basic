import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { hasServiceRole } from "@/lib/supabase/admin";
import AddAdmin from "./AddAdmin";
import AdminRow from "./AdminRow";

export default async function AdminsPage() {
  const supabase = await createClient();
  const [{ data: admins }, user] = await Promise.all([
    supabase.from("admins").select("*").order("created_at"),
    getUser(),
  ]);
  const me = (user?.email ?? "").toLowerCase();
  const canManage = hasServiceRole();
  const t = await getTranslations("admin.admins");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("intro")}</p>

      {!canManage && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent-soft/50 p-4 text-sm">
          <strong>{t("passwordDisabledTitle")}</strong> {t("passwordDisabledBody")}
        </div>
      )}

      <ul className="mb-6 divide-y divide-border rounded-xl border border-border bg-card">
        {(admins ?? []).map((a) => (
          <AdminRow
            key={a.email}
            email={a.email}
            isSelf={a.email.toLowerCase() === me}
            canManagePasswords={canManage}
          />
        ))}
        {(admins ?? []).length === 0 && <li className="p-4 text-sm text-muted">{t("noAdmins")}</li>}
      </ul>

      <AddAdmin disabled={!canManage} />
    </div>
  );
}
