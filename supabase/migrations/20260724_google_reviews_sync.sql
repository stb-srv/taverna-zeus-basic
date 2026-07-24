-- Automatischer Import von Google-Bewertungen über die offizielle Google
-- Places API (New). Läuft 1×/Tag serverseitig (in-process Scheduler +
-- optionaler Cron-Endpoint), dedupliziert per external_id (der von Google
-- vergebene, stabile Review-Name) und veröffentlicht importierte Bewertungen
-- sofort (Google moderiert bereits selbst).
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260724_google_reviews_sync.sql
-- Verify: select external_id, author_name, rating from reviews where external_id is not null;
-- Danach Typen ergänzen (src/lib/supabase/types.ts):
--   reviews: external_id: string | null  (Row/Insert/Update)
--   restaurant_settings: google_place_id: string | null, google_reviews_synced_at: string | null

alter table public.reviews
  add column if not exists external_id text;

-- Dedup-Schlüssel für API-Importe: verhindert doppelte Zeilen, wenn dieselbe
-- Google-Bewertung an mehreren Tagen in den Top-5 auftaucht. Partiell, damit
-- die vielen manuellen Zeilen mit external_id = null nicht kollidieren.
create unique index if not exists reviews_external_id_key
  on public.reviews (external_id)
  where external_id is not null;

-- Place ID einmalig auflösen und cachen; Zeitstempel des letzten Syncs als
-- 24h-Sperre (max. 1 Google-Abfrage pro Tag, unabhängig von der Aufrufhäufigkeit).
alter table public.restaurant_settings
  add column if not exists google_place_id text,
  add column if not exists google_reviews_synced_at timestamptz;
