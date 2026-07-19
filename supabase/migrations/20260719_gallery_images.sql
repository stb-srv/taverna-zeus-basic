-- Bildergalerie, optional pro Seite aktivierbar. context_key ist ein
-- generischer String-Schlüssel statt einer festen page_id-FK, damit sich die
-- Galerie später ohne Schema-Änderung auch an feste, nicht in "pages"
-- abgebildete Routen (z. B. 'home', 'location') anhängen lässt. Für
-- Admin-Seiten: context_key = 'page:' || pages.id.
--
-- Neuer Storage-Bucket "gallery-images", RLS-Policies gespiegelt von den
-- bestehenden Buckets site-images/menu-images (öffentlich lesbar, Schreiben
-- nur für is_admin()).
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260719_gallery_images.sql
-- Verify: select id, context_key, image_url, sort_order from gallery_images order by context_key, sort_order;
--         select id, public from storage.buckets where id = 'gallery-images';
-- Danach Typen neu generieren:
--   npx -y supabase gen types typescript --db-url "$DATABASE_URL" --schema public > src/lib/supabase/types.ts

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  context_key text not null,
  image_url text not null,
  alt_de text,
  alt_en text,
  alt_i18n jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_context_key_idx
  on public.gallery_images (context_key, sort_order);

alter table public.gallery_images enable row level security;

create policy "gallery_images_public_read"
  on public.gallery_images
  for select
  to anon, authenticated
  using (true);

create policy "gallery_images_admin_write"
  on public.gallery_images
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

create policy "gallery_images_bucket_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'gallery-images');

create policy "gallery_images_bucket_admin_write"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'gallery-images' and is_admin());

create policy "gallery_images_bucket_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'gallery-images' and is_admin())
  with check (bucket_id = 'gallery-images' and is_admin());

create policy "gallery_images_bucket_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'gallery-images' and is_admin());
