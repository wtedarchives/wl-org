-- Anonymous WTED requests: a row belongs to a profile or a guest token.
-- ip_hash is a server-side network ceiling (not the per-person key).
--
-- Apply in the Supabase SQL editor. Guards make a second run a no-op.

ALTER TABLE public.wted_requests
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.wted_requests
  ADD COLUMN IF NOT EXISTS guest_id uuid;

ALTER TABLE public.wted_requests
  ADD COLUMN IF NOT EXISTS ip_hash text;

ALTER TABLE public.wted_requests
  DROP CONSTRAINT IF EXISTS wted_requests_user_or_guest;

ALTER TABLE public.wted_requests
  ADD CONSTRAINT wted_requests_user_or_guest
  CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_wted_requests_guest_requested_at
  ON public.wted_requests (guest_id, requested_at DESC)
  WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wted_requests_ip_hash_requested_at
  ON public.wted_requests (ip_hash, requested_at DESC)
  WHERE ip_hash IS NOT NULL;

COMMENT ON COLUMN public.wted_requests.guest_id IS
  'Anonymous requester id from a server-signed guest token. Null when user_id is set.';

COMMENT ON COLUMN public.wted_requests.ip_hash IS
  'Hash of the client IP for the shared-network request ceiling. Not a stable person id.';
