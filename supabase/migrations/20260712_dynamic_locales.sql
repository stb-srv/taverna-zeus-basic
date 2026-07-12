-- Dynamische Sprachverwaltung: aktive Sprachen + maschinell übersetzte
-- UI-Texte für Sprachen ohne gebündelte messages/<locale>.json.
--
-- Ausführen im Supabase-Dashboard → SQL Editor (einmalig).
-- Danach idealerweise die Typen neu generieren:
--   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts

alter table public.restaurant_settings
  add column if not exists enabled_locales jsonb not null
    default '["de","en","el","ru","pl","nl","ar","es"]'::jsonb,
  add column if not exists ui_messages jsonb not null default '{}'::jsonb;
