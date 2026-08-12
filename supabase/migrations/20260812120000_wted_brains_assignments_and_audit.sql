-- wted-brains: per-show, time-boxed setlist access for non-admin users.
--
-- The feature: an admin assigns a show to a person. That person gets a
-- `wted-brains` entry in their user menu and may edit that show's setlist, but
-- only from 2h before show_time through 6h after. Outside the window the menu
-- item disappears and the server refuses their writes.
--
-- Why this is not a role flag on user_roles:
-- Authorization for the existing Admin Panel rides on the `is_admin` claim baked
-- into the Wysteria SSO JWT at login (sso-callback checkIsAdmin). That works
-- because is_admin is stable for weeks. A JWT cannot carry "may edit show X for
-- the next four hours" — JWT_EXPIRY_SECONDS is 7 days, so the token would grant
-- access long after the window closed and would deny it for a window opened after
-- login. There is therefore NO is_setlister column and NO new claim: the
-- assignment row IS the permission, re-checked against the DATABASE clock on
-- every mutation.
--
-- Additive migration. No existing table is altered and no existing object depends
-- on anything created here, so the pre-change dependency audit does not apply.

-- ─── Assignments ─────────────────────────────────────────────────────────────

create table public.brains_assignments (
  uuid          uuid primary key default gen_random_uuid(),
  show_id       uuid not null references public.shows (show_id) on delete cascade,
  profile_id    uuid not null references public.profiles (id)   on delete cascade,
  access_start  timestamptz not null,
  access_end    timestamptz not null,
  created_by    uuid not null references public.profiles (id),
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  constraint brains_assignments_window_ordered check (access_end > access_start)
);

comment on table public.brains_assignments is
  'Grants one profile edit access to one show for a bounded time window. The row
   is the permission — there is no setlister role flag and no JWT claim. Checked
   server-side on every dpro-admin mutation via brains_active_assignment().';

-- The window is STORED rather than computed from shows.show_time on demand, for
-- four reasons:
--   1. Shows run late. An admin can extend access_end for one assignment without
--      editing show data that the public archive reads.
--   2. It survives someone later editing show_time — otherwise a routine data fix
--      would silently move or revoke somebody's live access mid-show.
--   3. Only 108 of 1,568 shows have show_time at all. Storing the window lets an
--      admin assign the rest by entering it by hand.
--   4. Audit entries stay interpretable: you can see what the window WAS, not
--      what it would be recomputed as today.
comment on column public.brains_assignments.access_start is
  'Window opens. Pre-filled as show_time - 2h when show_time exists, else entered
   by the assigning admin. Deliberately stored, not derived — see table comment.';
comment on column public.brains_assignments.access_end is
  'Window closes. Pre-filled as show_time + 6h. Extend this when a show runs long.';
comment on column public.brains_assignments.revoked_at is
  'Set to cut access before access_end. Takes effect on the next request — there
   is no cached claim to wait out, which is the main practical advantage of
   checking assignments live rather than stamping a role into the JWT.';

-- One live assignment per (show, person). Partial on revoked_at is null so a
-- revoked assignment can be re-issued for the same pairing without first
-- deleting history.
create unique index brains_assignments_one_live_per_show_profile
  on public.brains_assignments (show_id, profile_id)
  where revoked_at is null;

-- Hot path: "is this profile inside a live window right now (for this show)?" —
-- runs on every mutation, so it is worth an index even though the table will hold
-- tens of rows, not thousands.
create index brains_assignments_live_lookup
  on public.brains_assignments (profile_id, access_start, access_end)
  where revoked_at is null;

create index brains_assignments_show_id on public.brains_assignments (show_id);

-- ─── Audit log ───────────────────────────────────────────────────────────────

create table public.brains_audit_log (
  uuid              uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  actor_profile_id  uuid references public.profiles (id) on delete set null,
  actor_username    text not null,
  assignment_id     uuid references public.brains_assignments (uuid) on delete set null,
  show_id           uuid references public.shows (show_id) on delete set null,
  show_label        text,
  surface           text not null,
  action            text not null,
  target_table      text,
  target_id         text,
  before            jsonb,
  after             jsonb,
  outcome           text not null,
  constraint brains_audit_log_surface_known
    check (surface in ('brains', 'admin')),
  constraint brains_audit_log_outcome_known
    check (outcome in ('success', 'denied', 'error'))
);

comment on table public.brains_audit_log is
  'Every mutation attempted through dpro-admin, written server-side inside the
   Edge Function after the actor has been verified. Never accepts client-supplied
   rows — a forgeable audit trail is worthless.';

-- Every foreign key here is nullable with ON DELETE SET NULL, and the human-
-- readable snapshots (actor_username, show_label) are what make that safe:
-- deleting a profile, an assignment or a show must not erase the record of what
-- was done. The snapshots also fix a subtler problem — profiles.username is
-- editable, so resolving the name by join at read time would display today's
-- username against last year's actions, silently rewriting history on rename.
comment on column public.brains_audit_log.actor_username is
  'Username as it was at write time. Kept alongside actor_profile_id because
   usernames are mutable and profiles can be deleted; the id gives correctness,
   the snapshot gives a log that stays readable.';
comment on column public.brains_audit_log.show_label is
  'Denormalized "mm.dd.yy — group — subvenue" at write time, same reasoning.';
comment on column public.brains_audit_log.outcome is
  'denied rows matter most: a refused write (wrong show, expired window,
   non-whitelisted column) is the clearest signal of misuse or of a UI bug.';
comment on column public.brains_audit_log.before is
  'Prior row state for updates and deletes. The SELECT that fetches it is the same
   one the scope check already needs to resolve an entry to its show, so it costs
   no extra round trip.';

create index brains_audit_log_actor
  on public.brains_audit_log (actor_profile_id, created_at desc);

create index brains_audit_log_show
  on public.brains_audit_log (show_id, created_at desc);

-- Supports the 90s cooldown on rpc_update_all_setlist_entries, which is derived
-- from this log rather than from a separate state table.
create index brains_audit_log_action_recent
  on public.brains_audit_log (action, created_at desc);

-- ─── Access ──────────────────────────────────────────────────────────────────

-- RLS on with no policies = deny-all for anon and authenticated. service_role
-- bypasses RLS, which is how dpro-admin reaches these tables. The REVOKEs are
-- belt-and-braces: RLS alone already blocks these roles, but removing the
-- default grants means a future policy added by mistake cannot open the tables
-- on its own.
alter table public.brains_assignments enable row level security;
alter table public.brains_audit_log   enable row level security;

revoke all on public.brains_assignments from anon, authenticated;
revoke all on public.brains_audit_log   from anon, authenticated;

-- Neither table is safe to expose: assignments would let anyone enumerate who is
-- setlisting which show, and the audit log carries before/after row images.

-- ─── Window check ────────────────────────────────────────────────────────────

create or replace function public.brains_active_assignment(
  p_profile_id uuid,
  p_show_id    uuid default null
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select a.uuid
  from public.brains_assignments a
  where a.profile_id = p_profile_id
    and a.revoked_at is null
    and now() between a.access_start and a.access_end
    and (p_show_id is null or a.show_id = p_show_id)
  order by a.access_end desc
  limit 1;
$$;

comment on function public.brains_active_assignment(uuid, uuid) is
  'Returns the live assignment uuid for this profile, or null. Pass p_show_id for
   show-scoped actions (editing a setlist entry, posting to Discourse); leave it
   null for the archive-wide dictionary inserts (songs, personnel, artists) where
   the strongest available check is "has SOME live window right now".

   The time comparison deliberately lives here rather than in the Edge Function
   so that "now" is always the database clock. A Deno-side check would trust the
   worker''s clock, and the returned uuid is also exactly what the audit row needs
   for assignment_id — one call answers both questions.';

-- ─── Atomic reorder ──────────────────────────────────────────────────────────

create or replace function public.brains_reorder_setlist_entries(p_entries jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  touched integer;
begin
  update public.setlist_entries se
  set entry_set    = e.entry_set,
      entry_setnum = e.entry_setnum
  from jsonb_to_recordset(p_entries)
    as e(entry_id uuid, entry_set text, entry_setnum integer)
  where se.entry_id = e.entry_id;

  get diagnostics touched = row_count;
  return touched;
end;
$$;

comment on function public.brains_reorder_setlist_entries(jsonb) is
  'Renumber a batch of setlist entries in one statement. Input is
   [{"entry_id":uuid,"entry_set":text,"entry_setnum":int}, ...]; returns the row
   count touched so the caller can confirm every entry landed.

   Why a function rather than a loop of updates from the Edge Function: a drag
   that moves a song up a set renumbers every row below it, and a partially
   applied renumber is a corrupted setlist — two entries sharing a setnum sort
   nondeterministically. One statement means one transaction: all rows move or
   none do.

   entry_set and entry_setnum are foreign keys onto sets(set) and
   setnums(setnums), so an out-of-range renumber fails the constraint rather than
   writing a value the rest of the archive cannot represent. setnums covers 1-105
   contiguously, well past any real set length.';

-- ─── Serialized stats rebuild ────────────────────────────────────────────────

create or replace function public.update_all_setlist_entries_locked()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Transaction-scoped advisory lock: released automatically when this statement's
  -- transaction ends, including on error or a dropped connection. A session-scoped
  -- lock could leak a permanent block if an Edge Function worker died mid-run.
  --
  -- The key is an arbitrary constant, unique to this operation.
  if not pg_try_advisory_xact_lock(4820135) then
    return false;
  end if;

  perform public.update_all_setlist_entries();
  return true;
end;
$$;

comment on function public.update_all_setlist_entries_locked() is
  'update_all_setlist_entries() guarded against overlapping runs. Returns false
   immediately if a rebuild is already in flight, true if this call ran one.

   Why: the rebuild takes 30-45 seconds and touches every setlist entry. Opening
   the Update button to setlisters means an admin and a setlister can now fire it
   concurrently, and a per-user rate limit cannot prevent that because they are
   different users. The lock is global by design.

   dpro-admin calls this instead of the bare function for ALL callers, admins
   included — overlap is the risk, not spam.';
