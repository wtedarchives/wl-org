-- Schedule share PNG exports (admin testing via radio-schedule-share-upload Edge Function).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'radio-schedules',
  'radio-schedules',
  true,
  20971520,
  array['image/png']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "radio_schedules_public_read"
on storage.objects
for select
to public
using (bucket_id = 'radio-schedules');
