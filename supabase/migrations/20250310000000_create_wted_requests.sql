-- wted_requests: tracks user song requests for WTED Radio (3 per 30 min limit)
CREATE TABLE IF NOT EXISTS public.wted_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.setlist_entries(entry_id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wted_requests_user_entry_unique UNIQUE (user_id, entry_id)
);

-- Index for fast lookups of user's recent requests (for rate limit check)
CREATE INDEX IF NOT EXISTS idx_wted_requests_user_requested_at
  ON public.wted_requests (user_id, requested_at DESC);

-- RLS: users can only read/insert their own requests
ALTER TABLE public.wted_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wted_requests"
  ON public.wted_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wted_requests"
  ON public.wted_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
