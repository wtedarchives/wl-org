-- RLS for show_posters (mirrors setlist_entries) + public image bucket.

ALTER TABLE public.show_posters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access on show_posters" ON public.show_posters;
DROP POLICY IF EXISTS "Allow admin users to insert show posters" ON public.show_posters;
DROP POLICY IF EXISTS "Allow authenticated users to update show posters" ON public.show_posters;
DROP POLICY IF EXISTS "Allow admin users to delete show posters" ON public.show_posters;

CREATE POLICY "Allow read access on show_posters"
  ON public.show_posters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin users to insert show posters"
  ON public.show_posters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_roles.id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

CREATE POLICY "Allow authenticated users to update show posters"
  ON public.show_posters
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin users to delete show posters"
  ON public.show_posters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_roles.id = auth.uid()
        AND user_roles.is_admin = true
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'show-posters',
  'show-posters',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "show_posters_public_read" ON storage.objects;

CREATE POLICY "show_posters_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'show-posters');
