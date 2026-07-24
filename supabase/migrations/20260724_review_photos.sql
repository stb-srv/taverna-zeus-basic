-- Fotos zu öffentlichen Bewertungen (/bewertungen): max. 5 pro Bewertung,
-- Upload NUR serverseitig über submitReview (service role) — der Bucket hat
-- bewusst keine anon/authenticated-INSERT-Policy, damit Bots den Storage
-- nicht an den Spam-Guards (Honeypot/Timing/Rate-Limit) vorbei füllen.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260724_review_photos.sql
-- Verify: select polname from pg_policy p join pg_class c on c.oid = p.polrelid
--           where c.relname = 'objects' and polname like 'review_images%';
-- Danach Typen ergänzen (src/lib/supabase/types.ts, reviews-Block):
--   photo_urls: string[] (Row) bzw. photo_urls?: string[] (Insert/Update)

alter table public.reviews
  add column if not exists photo_urls text[] not null default '{}';

alter table public.reviews
  add constraint reviews_photo_urls_max5
  check (coalesce(array_length(photo_urls, 1), 0) <= 5);

-- Spalten-Grant für anon neu ausstellen: photo_urls kommt dazu, email/
-- first_name/last_name bleiben ausgeschlossen (siehe
-- 20260723_review_submissions.sql).
revoke select on table public.reviews from anon;
grant select (id, author_name, rating, review_text_de, review_text_en,
              review_text_i18n, review_date, source, is_published,
              sort_order, created_at, photo_urls)
  on table public.reviews to anon;

-- Größen-/MIME-Limit im Bucket als zweite Verteidigungslinie — greift auch
-- für service-role-Uploads, falls die Validierung in der Action je ein Leck
-- bekommt.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-images', 'review-images', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "review_images_bucket_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'review-images');

-- Nur Löschen für Admins (Moderations-Cleanup über den Session-Client,
-- Muster wie gallery-images). KEINE insert/update-Policies: Schreiben
-- ausschließlich via service role.
create policy "review_images_bucket_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'review-images' and is_admin());
