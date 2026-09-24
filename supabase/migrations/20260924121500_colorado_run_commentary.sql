-- Private commentary clips. Uploads go through colorado-run-commentary
-- (service role). No public read policy: the bucket stays private.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'colorado-run-commentary',
  'colorado-run-commentary',
  false,
  5242880,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'video/webm']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.colorado_run_commentaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id),
  storage_path text not null,
  duration_seconds numeric not null check (duration_seconds > 0 and duration_seconds <= 60),
  content_type text not null,
  submitted_at timestamptz not null default now()
);

alter table public.colorado_run_commentaries enable row level security;

revoke all on table public.colorado_run_commentaries from anon, authenticated;
grant all on table public.colorado_run_commentaries to service_role;
