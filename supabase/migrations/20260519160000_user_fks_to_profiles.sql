-- Point user-scoped FKs at public.profiles instead of auth.users (Discourse SSO).
-- Legacy rows: profiles.id still matches former auth.users.id for existing accounts.

ALTER TABLE public.user_attended_shows
  DROP CONSTRAINT IF EXISTS user_attended_shows_user_id_fkey;

ALTER TABLE public.user_attended_shows
  ADD CONSTRAINT user_attended_shows_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.setlist_game_submissions
  DROP CONSTRAINT IF EXISTS setlist_game_submissions_user_id_fkey;

ALTER TABLE public.setlist_game_submissions
  ADD CONSTRAINT setlist_game_submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.setlist_game_picks
  DROP CONSTRAINT IF EXISTS setlist_game_picks_user_id_fkey;

ALTER TABLE public.setlist_game_picks
  ADD CONSTRAINT setlist_game_picks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.wted_requests
  DROP CONSTRAINT IF EXISTS wted_requests_user_id_fkey;

ALTER TABLE public.wted_requests
  ADD CONSTRAINT wted_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_id_fkey;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_id_fkey
  FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;
