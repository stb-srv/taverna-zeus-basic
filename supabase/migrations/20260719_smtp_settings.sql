-- SMTP-Konfiguration fürs Kontaktformular, im Admin unter „Standort & Kontakt“
-- pflegbar statt nur über Coolify-Umgebungsvariablen. Eigene Tabelle statt
-- Spalten auf restaurant_settings, weil restaurant_settings öffentlich per
-- `anon` lesbar ist (Startseite/Standort-Seite) — das Passwort darf niemals
-- über die öffentliche API erreichbar sein. src/lib/mail.ts liest diese
-- Tabelle über den Service-Role-Client (RLS-Bypass), weil der Versand auch
-- im Kontext eines anonymen Website-Besuchers ausgelöst wird; die
-- Umgebungsvariablen (SMTP_HOST etc.) bleiben als Fallback bestehen, falls
-- hier nichts eingetragen ist.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260719_smtp_settings.sql
-- Verify: select host, port, username, from_address, notify_email from smtp_settings where id = 1;
-- Danach Typen neu generieren:
--   npx -y supabase gen types typescript --db-url "$DATABASE_URL" --schema public > src/lib/supabase/types.ts

create table if not exists public.smtp_settings (
  id smallint primary key default 1 check (id = 1),
  host text,
  port integer,
  username text,
  password text,
  from_address text,
  notify_email text,
  updated_at timestamptz not null default now()
);

insert into public.smtp_settings (id) values (1)
  on conflict (id) do nothing;

alter table public.smtp_settings enable row level security;

-- Nur Admins dürfen die Konfiguration überhaupt lesen (Passwort!) oder ändern.
-- anon hat bewusst keine Policy — Zugriff nur über den Service-Role-Client.
create policy "smtp_settings_admin_read"
  on public.smtp_settings
  for select
  to authenticated
  using (is_admin());

create policy "smtp_settings_admin_write"
  on public.smtp_settings
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());
