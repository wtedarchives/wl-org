-- Colorado run top-10 ballots. Writes go through the colorado-run-vote Edge
-- Function (service role). The Wysteria session JWT is not a Supabase Auth
-- token, so auth.uid() policies cannot authorize the browser.

create table if not exists public.vote_ballots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id),
  submitted_at timestamptz not null default now()
);

create table if not exists public.vote_picks (
  id uuid primary key default gen_random_uuid(),
  ballot_id uuid not null references public.vote_ballots(id) on delete cascade,
  rank smallint not null check (rank between 1 and 10),
  selection text not null,
  unique (ballot_id, rank),
  unique (ballot_id, selection)
);

alter table public.vote_ballots enable row level security;
alter table public.vote_picks enable row level security;

revoke all on table public.vote_ballots from anon, authenticated;
revoke all on table public.vote_picks from anon, authenticated;
grant all on table public.vote_ballots to service_role;
grant all on table public.vote_picks to service_role;
