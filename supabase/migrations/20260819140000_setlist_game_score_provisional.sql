-- Mid-show Echo of a Show scores. Final `score` and `shows.show_scored` stay
-- untouched until an admin runs Score submissions.
alter table public.setlist_game_submissions
  add column if not exists score_provisional integer;
