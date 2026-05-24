-- Exclude [Improv/Jam] from song rankings pool.

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
      AND s2.song NOT IN (
        'Teaprise',
        'Buffalo Jam',
        '+15 Minutes Jam',
        'Rotation Jam',
        '+20 Minutes Jam',
        'Beast Pose',
        '+10 Minutes Jam',
        'Free Space',
        'Limbo',
        'No Drums',
        'Push Ups',
        'Wim Hof',
        '[Improv/Jam]'
      )
  );

  SELECT COUNT(*)::integer
  INTO rankable_count
  FROM public.songs
  WHERE song_rankable = true;

  RETURN rankable_count;
END;
$$;

COMMENT ON FUNCTION public.refresh_song_rankable() IS
  'Recompute songs.song_rankable from canonical-show + release-linked rules, minus permanent song-name exclusions.';

SELECT public.refresh_song_rankable();
