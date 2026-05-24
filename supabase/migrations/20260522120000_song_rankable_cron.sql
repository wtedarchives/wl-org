-- Rankable song pool: canonical show + release-linked setlist entry, not Cover Songs / placeholders.
-- Refreshed daily via pg_cron; ranking-engine reads songs.song_rankable = true.

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS song_rankable boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.songs.song_rankable IS
  'Eligible for user song rankings. Maintained by refresh_song_rankable().';

CREATE OR REPLACE FUNCTION public.refresh_song_rankable()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rankable_count integer;
BEGIN
  UPDATE public.songs
  SET song_rankable = false;

  UPDATE public.songs AS s
  SET song_rankable = true
  WHERE s.song_id IN (
    SELECT DISTINCT s2.song_id
    FROM public.songs AS s2
    INNER JOIN public.setlist_entries AS se ON se.entry_song = s2.song
    INNER JOIN public.shows AS sh ON sh.show_id = se.entry_show
    INNER JOIN public.setlist_entry_media AS sem ON sem.setlist_entry_id = se.entry_id
    WHERE sh.show_canonid IS NOT NULL
      AND COALESCE(s2.song_category, '') <> 'Cover Songs'
      AND s2.song_placeholder = false
      AND sem.release_id IS NOT NULL
  );

  SELECT COUNT(*)::integer
  INTO rankable_count
  FROM public.songs
  WHERE song_rankable = true;

  RETURN rankable_count;
END;
$$;

COMMENT ON FUNCTION public.refresh_song_rankable() IS
  'Recompute songs.song_rankable from canonical-show + release-linked eligibility rules.';

CREATE INDEX IF NOT EXISTS songs_song_rankable_true_idx
  ON public.songs (song_id)
  WHERE song_rankable = true;

-- pg_cron: daily at 06:00 UTC (requires pg_cron on your Supabase plan).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'refresh-song-rankable-daily';

SELECT cron.schedule(
  'refresh-song-rankable-daily',
  '0 6 * * *',
  $$SELECT public.refresh_song_rankable();$$
);

-- Populate rankable flags on first deploy.
SELECT public.refresh_song_rankable();
