-- Sicherheits-Fix: contact_messages und spam_blocks enthalten personenbezogene
-- Daten (Name, E-Mail, Telefon, Nachricht, IP). Bisher durfte die gesamte Rolle
-- `authenticated` sie mit `using (true)` lesen/ändern/löschen — also JEDER
-- eingeloggte Nutzer, nicht nur Admins. Alle anderen Verwaltungstabellen
-- (smtp_settings, reviews, gallery_images, kitchen_hours) beschränken diese
-- Zugriffe bereits per `is_admin()`; hier wird dasselbe nachgezogen.
--
-- INSERT bleibt bewusst offen (anon + authenticated), damit das öffentliche
-- Kontaktformular und das Spam-Logging weiter funktionieren — dort werden nur
-- Daten geschrieben, nie gelesen.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260721_restrict_contact_messages_to_admins.sql
-- Verify:
--   select polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) as using
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname in ('contact_messages','spam_blocks') order by c.relname, polcmd;

-- --- contact_messages: Lesen/Ändern/Löschen nur für Admins ---------------
drop policy if exists "contact_messages_select_authenticated" on public.contact_messages;
drop policy if exists "contact_messages_update_authenticated" on public.contact_messages;
drop policy if exists "contact_messages_delete_authenticated" on public.contact_messages;

create policy "contact_messages_select_admin"
  on public.contact_messages for select
  to authenticated using (is_admin());

create policy "contact_messages_update_admin"
  on public.contact_messages for update
  to authenticated using (is_admin()) with check (is_admin());

create policy "contact_messages_delete_admin"
  on public.contact_messages for delete
  to authenticated using (is_admin());

-- --- spam_blocks: Lesen/Löschen nur für Admins ---------------------------
drop policy if exists "spam_blocks_select_authenticated" on public.spam_blocks;
drop policy if exists "spam_blocks_delete_authenticated" on public.spam_blocks;

create policy "spam_blocks_select_admin"
  on public.spam_blocks for select
  to authenticated using (is_admin());

create policy "spam_blocks_delete_admin"
  on public.spam_blocks for delete
  to authenticated using (is_admin());
