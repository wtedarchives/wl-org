-- Split "exists on the station" from "can be requested" on wted_radio_ids.
--
-- Context: the sync previously pulled only the PUBLIC Radio.co requests feed
-- (6,435 tracks), so every catalog row was implicitly requestable. The sync is
-- moving to the Studio API (8,808 tracks) to pick up commentary, intros, set
-- breaks, bumpers and station IDs that the public feed omits — those are needed
-- for wted_user_playlist_items but must NOT appear in the request modal.
-- `requestable` carries that distinction; the public feed remains the only
-- source of truth for it.
--
-- NOTE: this table predates the migrations directory and is not created by any
-- migration. Live schema facts confirmed by audit on 2026-08-06:
--   * PRIMARY KEY is (radio_id), not (uuid) — uuid has its own unique index.
--   * Three inbound FKs reference wted_radio_ids(radio_id):
--       setlist_entries          ON UPDATE CASCADE ON DELETE SET NULL
--       wted_requests            ON UPDATE CASCADE ON DELETE SET NULL
--       wted_user_playlist_items ON DELETE CASCADE
--     (the ON DELETE CASCADE declared in 20250412000000 is stale — live is SET NULL)
--   * No triggers, views, or materialized views depend on this table.
--   * Grants are table-level, so a new column is readable by anon automatically.
--
-- This migration was applied directly via the Supabase SQL editor first; the
-- guards below make `supabase db push` a no-op against the live database.

-- Backfill must run ONLY on first creation. Re-running the bare UPDATE later
-- would flip every non-requestable Studio track back to true, dumping station
-- IDs and bumpers into the public request modal.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wted_radio_ids'
      and column_name = 'requestable'
  ) then
    -- Default FALSE is deliberate: a track is hidden until the public-feed pass
    -- proves it requestable, so a failed/partial sync can never leak tracks.
    alter table public.wted_radio_ids
      add column requestable boolean not null default false;

    -- Freeze the request list exactly as it was at migration time (all 6,451
    -- rows), so shipping this changes nothing user-visible. The first Studio
    -- sync then corrects the 16 stale `skipped` rows that are no longer in the
    -- public feed.
    update public.wted_radio_ids set requestable = true;
  end if;
end $$;

comment on column public.wted_radio_ids.requestable is
  'True when this track appears in the public Radio.co requests feed. Gates the
   user-facing request modal. Studio-sourced tracks (commentary, bumpers, station
   IDs) are inserted false and only flipped true by the public-feed pass in
   syncWtedRadioIds.';

create index if not exists wted_radio_ids_requestable_idx
  on public.wted_radio_ids (requestable) where requestable;

-- RLS: INSERT/UPDATE were open to ANY authenticated user (`check=true`), which
-- let any logged-in user PATCH the catalog via PostgREST. Harmless-ish before,
-- but `requestable` gates a public list — a single PATCH could empty the request
-- modal for everyone. Restrict to admins, matching the existing DELETE policy.
-- Safe: no client-side code writes to this table (all usage is .select()), and
-- dpro-admin / wted-radio-backfill-artwork / wted-requests all use the service
-- role, which bypasses RLS. SELECT stays public — the catalog is read anonymously.
drop policy if exists "Allow authenticated users to insert wted_radio_ids" on public.wted_radio_ids;
drop policy if exists "Allow authenticated users to update wted_radio_ids" on public.wted_radio_ids;

drop policy if exists "Allow admin users to insert wted_radio_ids" on public.wted_radio_ids;
create policy "Allow admin users to insert wted_radio_ids"
  on public.wted_radio_ids for insert to authenticated
  with check (exists (
    select 1 from public.user_roles
    where user_roles.id = auth.uid() and user_roles.is_admin = true
  ));

drop policy if exists "Allow admin users to update wted_radio_ids" on public.wted_radio_ids;
create policy "Allow admin users to update wted_radio_ids"
  on public.wted_radio_ids for update to authenticated
  using (exists (
    select 1 from public.user_roles
    where user_roles.id = auth.uid() and user_roles.is_admin = true
  ))
  with check (exists (
    select 1 from public.user_roles
    where user_roles.id = auth.uid() and user_roles.is_admin = true
  ));
