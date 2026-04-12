-- wted_requests: store radio_id (FK to wted_radio_ids) instead of setlist entry_id

ALTER TABLE public.wted_requests
  DROP CONSTRAINT IF EXISTS wted_requests_user_entry_unique;

ALTER TABLE public.wted_requests
  DROP CONSTRAINT IF EXISTS wted_requests_entry_id_fkey;

ALTER TABLE public.wted_requests
  DROP COLUMN entry_id;

ALTER TABLE public.wted_requests
  ADD COLUMN radio_id text NOT NULL REFERENCES public.wted_radio_ids (radio_id) ON DELETE CASCADE;
