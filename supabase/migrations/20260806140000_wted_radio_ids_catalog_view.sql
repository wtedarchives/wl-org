-- Resolved artwork for the "Request a Song" catalog.
--
-- Artwork hierarchy:
--   1. Custom art uploaded to Radio.co  -> wted_radio_ids.artwork
--   2. else the show's earliest release -> releases_shows (lowest release_order)
--                                          -> releases.release_artwork
--   3. else                             -> /WL.png, applied client-side
--
-- Tier 1 is STORED because `artwork.type === 'custom'` exists only in the
-- authenticated Radio.co Studio API (the public requests feed omits `type`
-- entirely), so it has to be synced in. Radio.co's `type = 'default'` URLs are
-- automatic iTunes matches, NOT curated art, and are deliberately excluded —
-- a hand-picked release cover beats an auto-matched album cover.
--
-- Tier 2 is DERIVED rather than precomputed. Every input already lives in this
-- database with its own FKs, so a stored copy would go stale the moment
-- releases.release_artwork changed — which is exactly why the artwork backfill
-- needs a resumable "Re-verify all" sweep today. Resolving at read time makes
-- that whole class of drift impossible.
--
-- A show routinely has SEVERAL releases (295 of 565 sampled shows do; one has
-- seven). `release_order` ranks them, and the lowest is the one that represents
-- the show — so this is a canonical-release choice, not a fallback search.
--
-- Verified 2026-08-06: the lowest release_order for a show is NOT always 1, so
-- this must be `order by release_order limit 1` and never `where release_order
-- = 1` — the latter silently returns nothing for shows whose ranking starts
-- higher. No show currently has two releases sharing a release_order; the
-- release_id tie-break just keeps the pick stable if that ever changes.
-- releases.release_artwork is NOT NULL on all 1,227 rows, releases_shows is
-- 1,305 rows, and wted_radio_ids.show_id is populated on 6,435 of 6,451.

-- Supports the lateral's `where show_id = ? order by release_order limit 1`.
create index if not exists releases_shows_show_id_release_order_idx
  on public.releases_shows (show_id, release_order);

drop view if exists public.wted_radio_ids_catalog;

-- security_invoker (PG15+) makes the view honour the CALLER's RLS rather than
-- the owner's. Without it the view would silently bypass RLS on every table it
-- touches. All three tables are anon-readable today, so this changes nothing
-- now — it just means the view can never become an accidental privilege hole.
create view public.wted_radio_ids_catalog
with (security_invoker = on) as
select
  w.uuid,
  w.radio_id,
  w.track_artist,
  w.track_title,
  w.status,
  w.requestable,
  w.show_id,
  -- Kept separate so the admin panel can tell "Radio.co custom" from "resolved
  -- from the show" without re-deriving it.
  nullif(btrim(w.artwork), '') as custom_artwork,
  coalesce(
    nullif(btrim(w.artwork), ''),
    nullif(btrim(rel.release_artwork), '')
  ) as artwork
from public.wted_radio_ids w
left join lateral (
  select r.release_artwork
  from public.releases_shows rs
  join public.releases r on r.release_id = rs.release_id
  where rs.show_id = w.show_id
  -- release_id breaks ties so the choice is stable across queries when a show
  -- has two releases sharing a release_order.
  order by rs.release_order asc, r.release_id asc
  limit 1
) rel on true;

comment on view public.wted_radio_ids_catalog is
  'Request-a-Song catalog with artwork resolved: Radio.co custom art, else the
   show''s lowest-release_order release artwork. `artwork` is the value to
   display; `custom_artwork` exposes tier 1 alone. Clients fall back to /WL.png
   when `artwork` is null.';

grant select on public.wted_radio_ids_catalog to anon, authenticated;
