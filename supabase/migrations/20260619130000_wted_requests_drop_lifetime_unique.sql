-- Re-requests are allowed after the 60-minute window (enforced in wted-request Edge Function).
-- Drop the lifetime unique constraint on (user_id, radio_id).

ALTER TABLE public.wted_requests
  DROP CONSTRAINT IF EXISTS wted_requests_user_entry_unique;
