-- Manuell gepflegte Kundenbewertungen (z. B. übertragen von Google), die auf
-- der Startseite gezeigt werden und die aggregateRating/Review-Angaben in den
-- strukturierten Daten (JSON-LD) speisen.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260719_reviews.sql
-- Verify: select author_name, rating, is_published from reviews order by sort_order;
-- Danach Typen neu generieren:
--   npx -y supabase gen types typescript --db-url "$DATABASE_URL" --schema public > src/lib/supabase/types.ts

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  review_text_de text,
  review_text_en text,
  review_text_i18n jsonb not null default '{}'::jsonb,
  review_date date,
  source text not null default 'google',
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reviews_published_idx
  on public.reviews (is_published, sort_order);

alter table public.reviews enable row level security;

create policy "reviews_public_read"
  on public.reviews
  for select
  to anon
  using (is_published = true);

create policy "reviews_auth_read"
  on public.reviews
  for select
  to authenticated
  using (true);

create policy "reviews_admin_write"
  on public.reviews
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());
