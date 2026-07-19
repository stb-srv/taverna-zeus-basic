-- Küchenöffnungszeiten, unabhängig von den allgemeinen Öffnungszeiten
-- (opening_hours), da die Küche z. B. früher schließen kann. Eigene Tabelle
-- statt Diskriminator-Spalte auf opening_hours, damit bestehende Abfragen
-- (getOpeningHours/updateHours) unangetastet bleiben. Ein-/ausblendbar über
-- restaurant_settings.kitchen_hours_enabled.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260719_kitchen_hours.sql
-- Verify: select * from kitchen_hours order by day_of_week; select kitchen_hours_enabled from restaurant_settings where id = 1;
-- Danach Typen neu generieren:
--   npx -y supabase gen types typescript --db-url "$DATABASE_URL" --schema public > src/lib/supabase/types.ts

alter table public.restaurant_settings
  add column if not exists kitchen_hours_enabled boolean not null default false;

create table if not exists public.kitchen_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null,
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  sort_order int not null default 0
);

alter table public.kitchen_hours enable row level security;

create policy "kitchen_hours_public_read"
  on public.kitchen_hours
  for select
  to anon, authenticated
  using (true);

create policy "kitchen_hours_admin_write"
  on public.kitchen_hours
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());
