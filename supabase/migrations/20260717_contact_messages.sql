-- Kontaktformular (öffentlich, /standort). Anon darf ausschließlich
-- einfügen; Lesen/Bearbeiten/Löschen bleibt eingeloggten Admins
-- (authenticated-Rolle) vorbehalten. Erster Tisch mit anonymem Schreibzugriff
-- in dieser App — RLS wird deshalb explizit hier gesetzt, nicht im Dashboard.
--
-- Run: node scripts/run-sql.mjs supabase/migrations/20260717_contact_messages.sql
-- Verify: select id, name, email, created_at, read_at from public.contact_messages order by created_at desc limit 5;

create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  locale text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "contact_messages_insert_anon"
  on public.contact_messages
  for insert
  to anon
  with check (true);

create policy "contact_messages_select_authenticated"
  on public.contact_messages
  for select
  to authenticated
  using (true);

create policy "contact_messages_update_authenticated"
  on public.contact_messages
  for update
  to authenticated
  using (true)
  with check (true);

create policy "contact_messages_delete_authenticated"
  on public.contact_messages
  for delete
  to authenticated
  using (true);
