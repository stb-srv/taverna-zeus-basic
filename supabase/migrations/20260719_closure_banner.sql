-- Urlaubs-/Feiertags-Hinweis (Betriebsferien). Admin trägt Zeitraum + Text
-- ein; die Website zeigt den Hinweis automatisch an, solange das heutige
-- Datum im gewählten Zeitraum liegt (siehe src/lib/closure-window.ts).
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260719_closure_banner.sql
-- Verify: select closure_banner_enabled, closure_banner_from, closure_banner_until from restaurant_settings where id = 1;
-- Danach Typen neu generieren:
--   npx -y supabase gen types typescript --db-url "$DATABASE_URL" --schema public > src/lib/supabase/types.ts

alter table public.restaurant_settings
  add column if not exists closure_banner_enabled boolean not null default false,
  add column if not exists closure_banner_message_de text,
  add column if not exists closure_banner_message_en text,
  add column if not exists closure_banner_message_i18n jsonb not null default '{}'::jsonb,
  add column if not exists closure_banner_from date,
  add column if not exists closure_banner_until date;
