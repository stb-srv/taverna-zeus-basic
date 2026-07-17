-- Social-Media-Links (Instagram, Facebook, TikTok, WhatsApp), pro Plattform
-- einzeln aktivier-/deaktivierbar. Fester Satz von 4 Plattformen, keine
-- Übersetzung nötig (URLs/Telefonnummer sind keine lokalisierbaren Inhalte).
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260717_social_links.sql
-- Verify: select social_links from restaurant_settings where id = 1;
-- Danach Typen neu generieren:
--   npx -y supabase gen types typescript --db-url "$DATABASE_URL" --schema public > src/lib/supabase/types.ts

alter table public.restaurant_settings
  add column if not exists social_links jsonb not null default '{}'::jsonb;
