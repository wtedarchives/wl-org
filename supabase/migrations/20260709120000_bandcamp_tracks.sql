-- bandcamp_tracks: link individual Bandcamp tracks to setlist entries.
-- One row per (setlist entry -> Bandcamp track). The same track_id/track_link may
-- appear on multiple rows when several entries map to one track (medley case,
-- e.g. "Song A > Song B" is a single Bandcamp track but two setlist entries).
CREATE TABLE IF NOT EXISTS public.bandcamp_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.setlist_entries(entry_id) ON DELETE CASCADE,
  track_link text NOT NULL,
  track_id bigint NOT NULL,
  track_title text,
  album_id bigint NOT NULL,
  album_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bandcamp_tracks_entry_track_unique UNIQUE (entry_id, track_id)
);

-- Fast lookup of all Bandcamp tracks for a show's setlist entries.
CREATE INDEX IF NOT EXISTS idx_bandcamp_tracks_entry_id
  ON public.bandcamp_tracks (entry_id);

-- RLS: public read (front-end fetches with the anon key, no Supabase auth session);
-- writes happen only via the service-role dpro-admin edge function, which bypasses RLS.
ALTER TABLE public.bandcamp_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view bandcamp_tracks"
  ON public.bandcamp_tracks
  FOR SELECT
  USING (true);
