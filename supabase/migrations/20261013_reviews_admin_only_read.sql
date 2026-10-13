-- Bewertungen (inkl. E-Mail und Klarnamen) sind nur für Admins lesbar.
-- Bisher durfte jeder eingeloggte Nutzer alle Zeilen lesen (reviews_auth_read).
-- Die Admin-Policy reviews_admin_write (for all, is_admin()) deckt SELECT bereits ab.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20261013_reviews_admin_only_read.sql
-- Verify: select policyname from pg_policies where tablename = 'reviews';

drop policy if exists "reviews_auth_read" on public.reviews;
