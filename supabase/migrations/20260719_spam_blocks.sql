-- Log der stillen Bot-Fallen im Kontaktformular (Honeypot-Feld, Mindestausfüllzeit),
-- damit im Admin sichtbar ist, wie oft sie greifen. Absichtlich kein Log der
-- eigentlichen Formulardaten (Bots können beliebigen Text ins Honeypot-Feld
-- schreiben) — nur Grund, Zeitpunkt, IP und Sprache.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260719_spam_blocks.sql
-- Verify: select reason, count(*) from spam_blocks group by reason;

create table if not exists public.spam_blocks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  reason text not null check (reason in ('honeypot', 'too_fast')),
  ip text,
  locale text
);

create index if not exists spam_blocks_created_at_idx
  on public.spam_blocks (created_at desc);

alter table public.spam_blocks enable row level security;

-- Sowohl anon (normale Besucher) als auch authenticated (falls im selben
-- Browser eine Admin-Session aktiv ist, siehe contact_messages) dürfen
-- protokollieren — das Absenden des öffentlichen Formulars darf nie an der
-- eingeloggten Rolle scheitern.
create policy "spam_blocks_insert_public"
  on public.spam_blocks
  for insert
  to anon, authenticated
  with check (true);

create policy "spam_blocks_select_authenticated"
  on public.spam_blocks
  for select
  to authenticated
  using (true);

create policy "spam_blocks_delete_authenticated"
  on public.spam_blocks
  for delete
  to authenticated
  using (true);
