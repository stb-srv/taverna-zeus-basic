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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl">Admins</h1>
      <p className="mb-6 text-sm text-muted">
        Wer hier gelistet ist, darf Inhalte bearbeiten. Beim Anlegen wird ein Login-Konto mit Passwort erstellt.
      </p>

      {!canManage && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent-soft/50 p-4 text-sm">
          <strong>Passwort-Verwaltung ist deaktiviert.</strong> Um Konten mit Passwort anzulegen oder
          Passwörter zu ändern, trage das <code>service_role</code>-Secret (Supabase → Project Settings
          → API) als <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code> ein und starte den
          Server neu. Ohne den Schlüssel lassen sich E-Mails nur freischalten (Konto muss dann separat existieren).
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
        {(admins ?? []).length === 0 && <li className="p-4 text-sm text-muted">Noch keine Admins.</li>}
      </ul>

      <AddAdmin disabled={!canManage} />
    </div>
  );
}
