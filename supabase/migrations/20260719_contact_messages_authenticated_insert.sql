-- Erlaubt zusätzlich eingeloggten Admins (authenticated), Nachrichten in
-- contact_messages einzufügen. Bisher durfte nur `anon` einfügen — das führte
-- dazu, dass ein Test des öffentlichen Kontaktformulars fehlschlug, sobald im
-- selben Browser gleichzeitig eine aktive /admin-Session bestand (der
-- Supabase-Server-Client nutzt dann die authenticated-Session statt des
-- anonymen Keys, und es gab keine passende Insert-Policy).
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260719_contact_messages_authenticated_insert.sql
-- Verify: select polname, polroles::regrole[] from pg_policy p join pg_class c on c.oid = p.polrelid where c.relname = 'contact_messages' and polcmd = 'a';

create policy "contact_messages_insert_authenticated"
  on public.contact_messages
  for insert
  to authenticated
  with check (true);
