-- Öffentliche Bewertungs-Einreichungen (/bewertungen): Besucher schreiben
-- Bewertungen, die erst nach Freischaltung im Admin erscheinen. E-Mail und
-- Klarname (Vor-/Nachname) sind für anon per Spalten-Grants unlesbar —
-- öffentlich sichtbar ist nur der berechnete Anzeigename (author_name).
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260723_review_submissions.sql
-- Verify: select polname, polroles::regrole[] from pg_policy p
--           join pg_class c on c.oid = p.polrelid where c.relname = 'reviews';
-- Danach Typen neu generieren:
--   npx -y supabase gen types typescript --db-url "$DATABASE_URL" --schema public > src/lib/supabase/types.ts

alter table public.reviews
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists email text;

-- anon darf email/first_name/last_name NIE lesen — Spalten-Grants statt nur
-- "nicht rendern": RLS ist zeilenbasiert, veröffentlichte Zeilen wären sonst
-- inkl. E-Mail über die Supabase-REST-API abrufbar. Konsequenz: anon-Queries
-- müssen eine explizite Spaltenliste selektieren (kein select("*") mehr),
-- siehe getPublishedReviews() in src/lib/queries.ts.
revoke select on table public.reviews from anon;
grant select (id, author_name, rating, review_text_de, review_text_en,
              review_text_i18n, review_date, source, is_published,
              sort_order, created_at)
  on table public.reviews to anon;

-- Insert für anon UND authenticated (eine aktive Admin-Session im selben
-- Browser lässt den Server-Client mit der authenticated-Rolle schreiben —
-- siehe 20260719_contact_messages_authenticated_insert.sql). WITH CHECK
-- verhindert Selbst-Veröffentlichung und gefälschte Felder; Freischaltung
-- läuft ausschließlich über reviews_admin_write (is_admin()).
create policy "reviews_public_insert"
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    is_published = false
    and source = 'website'
    and sort_order = 0
    and first_name is not null
    and email is not null
  );
