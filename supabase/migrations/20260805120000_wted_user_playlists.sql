-- User-built radio playlists.
--
-- Supabase is the source of truth: users create playlists, pick tracks from the
-- wted_radio_ids catalog, and reorder them freely. Radio.co is a publish target,
-- not storage — a playlist only reaches the station when it is pushed via the
-- radio-co-playlists edge function, which records the resulting Studio id here.
--
-- Why items are stored as (playlist_id, position) rows rather than an array:
-- Radio.co's PATCH /playlists/{id} replaces `/items` wholesale, so a save always
-- rewrites the full ordered list anyway. Rows give us the FK to wted_radio_ids
-- (so deleted catalog tracks can't linger in a playlist) and cheap per-track
-- queries for the picker UI.
--
-- Managed by edge functions (service role); no direct client access, so RLS is
-- on with no policies — matching tv_pairings and push_subscriptions.

create table if not exists public.wted_user_playlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  -- Mirrors Radio.co's Playlist.colour pattern so publishing can't be rejected.
  colour text not null default '#51cf66' check (colour ~ '^#[a-fA-F0-9]{6}$'),
  -- Radio.co playlist metadata; defaults are applied at publish time when null.
  metadata_artist text,
  metadata_title text,
  -- Set once the playlist has been pushed to Radio.co. Null = draft only.
  radio_co_playlist_id bigint unique,
  published_at timestamptz,
  publish_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wted_user_playlists_profile_id_idx
  on public.wted_user_playlists (profile_id);

create index if not exists wted_user_playlists_radio_co_playlist_id_idx
  on public.wted_user_playlists (radio_co_playlist_id)
  where radio_co_playlist_id is not null;

comment on table public.wted_user_playlists is
  'User-built radio playlists (source of truth). Published to Radio.co via the radio-co-playlists edge function.';

comment on column public.wted_user_playlists.radio_co_playlist_id is
  'Radio.co Studio playlist id once published; null while the playlist is a local draft.';

create table if not exists public.wted_user_playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null
    references public.wted_user_playlists (id) on delete cascade,
  -- FK to the synced Radio.co track catalog; radio_id is Radio.co's track id as text.
  radio_id text not null
    references public.wted_radio_ids (radio_id) on delete cascade,
  -- Zero-based, matching the order Radio.co assigns from the items array.
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  -- A track may appear only once per playlist; keeps publish payloads de-duped.
  constraint wted_user_playlist_items_unique_track unique (playlist_id, radio_id)
);

create index if not exists wted_user_playlist_items_playlist_position_idx
  on public.wted_user_playlist_items (playlist_id, position);

comment on table public.wted_user_playlist_items is
  'Ordered tracks within a user playlist. Rewritten wholesale on save, mirroring Radio.co''s replace-only /items patch.';

alter table public.wted_user_playlists enable row level security;
alter table public.wted_user_playlist_items enable row level security;
