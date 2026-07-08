-- Bot read API: API keys + request logging (service role / Edge Function only).

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.bot_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_bot_api_keys_key_hash
  ON public.bot_api_keys (key_hash)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.bot_api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.bot_api_keys (id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  query_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_code integer NOT NULL,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_api_request_logs_created_at
  ON public.bot_api_request_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bot_api_request_logs_api_key_id
  ON public.bot_api_request_logs (api_key_id, created_at DESC);

ALTER TABLE public.bot_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_api_request_logs ENABLE ROW LEVEL SECURITY;

-- No RLS policies: anon/authenticated cannot access; service role bypasses RLS.

COMMENT ON TABLE public.bot_api_keys IS
  'Hashed API keys for the bot-read-api Edge Function. Plaintext keys are only returned once from generate_bot_api_key().';

COMMENT ON TABLE public.bot_api_request_logs IS
  'Full request audit log for bot-read-api (all endpoints, including auth failures).';

-- Generate a new API key (run in SQL editor with service role / postgres).
-- Returns the plaintext key once; only the SHA-256 hex hash is stored.
CREATE OR REPLACE FUNCTION public.generate_bot_api_key(p_label text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  raw_key text;
  key_hash text;
BEGIN
  IF p_label IS NULL OR btrim(p_label) = '' THEN
    RAISE EXCEPTION 'label is required';
  END IF;

  raw_key := 'wted_' || encode(extensions.gen_random_bytes(32), 'hex');
  key_hash := encode(extensions.digest(raw_key, 'sha256'), 'hex');

  INSERT INTO public.bot_api_keys (label, key_hash)
  VALUES (btrim(p_label), key_hash);

  RETURN raw_key;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_bot_api_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_bot_api_key(text) TO service_role;
