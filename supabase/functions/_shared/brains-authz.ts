/**
 * wted-brains authorization — the complete policy for what a non-admin may do.
 *
 * `dpro-admin` historically had one gate: `is_admin !== true → 403`, covering all
 * 57 actions. wted-brains introduces a second class of caller who may reach a
 * small subset of those actions, for one show, during a bounded time window.
 *
 * The policy lives in ONE table below rather than scattered through the action
 * handlers, so the whole permission surface can be read at a glance and reviewed
 * as a unit. Two rules make it safe to extend:
 *
 *   1. FAIL CLOSED. An action absent from SETLISTER_RULES is admin-only. Adding a
 *      new action to dpro-admin therefore cannot accidentally widen access.
 *   2. REJECT, DON'T STRIP. A payload carrying a column the caller may not write
 *      is refused with a 403 naming the column, rather than silently filtered.
 *      Silent filtering makes UI bugs invisible; a loud refusal surfaces them in
 *      development.
 *
 * Time is never read from Deno. `brains_active_assignment()` compares against the
 * database clock, so a skewed worker cannot extend anybody's window.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

/** Where the show this call targets can be found. */
type ShowRef =
  /** Directly on the body, e.g. `body.show_id`. */
  | { from: "body"; key: string }
  /** Inside the insert payload, e.g. `body.row.entry_show`. */
  | { from: "row"; key: string }
  /** Resolved by looking the entry up, e.g. `body.entry_id` → `entry_show`. */
  | { from: "entry"; key: string }
  /** Resolved from an array of entries, e.g. `body.entries[].entry_id`. */
  | { from: "entryList"; key: string; idField: string }

interface SetlisterRule {
  /**
   * Absent means the action is archive-wide and cannot be tied to a show — the
   * strongest available check is then "caller has SOME live window right now".
   * True of the dictionary inserts: songs, personnel, artists, and the stats
   * rebuild. That is inherent to the job (a debuted song must be addable) and is
   * the main thing brains_audit_log exists to cover.
   */
  showRef?: ShowRef
  /** Body key holding the column payload, when the action writes columns. */
  payloadKey?: "row" | "patch"
  /** Columns the caller may write inside `payloadKey`. */
  columns?: readonly string[]
  /** Values overwritten on the body regardless of what the client sent. */
  force?: Record<string, unknown>
  /** For the audit row. */
  targetTable?: string
  /** Body key holding the id of the row being changed, for the audit row. */
  targetIdKey?: string
  /** Reads still need the scope check, but must not be logged as changes. */
  readOnly?: true
}

/**
 * Setlist entry columns a setlister may write.
 *
 * Deliberately excludes two that `setlist_entries_update` otherwise permits:
 *   - `radio_id`, which links an entry to a Radio.co track and triggers
 *     sync_wted_radio_id_show() — archive plumbing, not show-day data entry.
 *   - `entry_length`, which is not in the brains entry form.
 */
const SETLIST_ENTRY_COLUMNS = [
  "entry_set",
  "entry_setnum",
  "entry_song",
  "entry_new",
  "entry_short",
  "entry_segue",
  "entry_placement",
  "entry_coachnotes",
] as const

export const SETLISTER_RULES: Record<string, SetlisterRule> = {
  // ─── The assigned show's setlist ──────────────────────────────────────────
  setlist_entries_insert: {
    showRef: { from: "row", key: "entry_show" },
    payloadKey: "row",
    // entry_show is writable here (it is how the row is attached to the show)
    // but the scope check above has already confirmed it is the assigned show.
    columns: [...SETLIST_ENTRY_COLUMNS, "entry_show"],
    targetTable: "setlist_entries",
  },
  setlist_entries_update: {
    showRef: { from: "entry", key: "entry_id" },
    payloadKey: "patch",
    columns: SETLIST_ENTRY_COLUMNS,
    targetTable: "setlist_entries",
    targetIdKey: "entry_id",
  },
  setlist_entries_delete: {
    showRef: { from: "entry", key: "entry_id" },
    targetTable: "setlist_entries",
    targetIdKey: "entry_id",
  },
  setlist_entries_reorder: {
    showRef: { from: "entryList", key: "entries", idField: "entry_id" },
    // Placement rides along so a cross-set drag reassigns it with the set, instead
    // of leaving "Main Set 1" on a song now sitting in set 2.
    targetTable: "setlist_entries",
  },

  // ─── Personnel on an entry ────────────────────────────────────────────────
  setlist_entry_guests_select: {
    showRef: { from: "entry", key: "setlist_entry_id" },
    targetTable: "setlist_entry_guests",
    targetIdKey: "setlist_entry_id",
    readOnly: true,
  },
  setlist_entry_guests_replace: {
    showRef: { from: "entry", key: "setlist_entry_id" },
    targetTable: "setlist_entry_guests",
    targetIdKey: "setlist_entry_id",
  },

  // ─── The one editable show field ──────────────────────────────────────────
  // `shows_update` otherwise accepts 19 columns including show_iscanon,
  // show_date and show_time. Hiding those in the UI stops nothing: the handler
  // writes whatever keys the payload carries, so a hand-built request could set
  // any of them. This one-item whitelist is the actual control.
  shows_update: {
    showRef: { from: "body", key: "show_id" },
    payloadKey: "patch",
    columns: ["show_coachnotes"],
    targetTable: "shows",
    targetIdKey: "show_id",
  },

  // ─── Live-show posting ────────────────────────────────────────────────────
  // These publish to Discourse chat, push notifications, and Bluesky text.
  // Share-card images (Bluesky artwork + Instagram) stay on the admin setlist
  // tab — dpro-admin ignores media when surface is brains. Scoped to the
  // assigned show and inside the window, which is what makes them safe to
  // delegate: a setlister can only announce the show they are working.
  setlist_discourse_show_event: {
    showRef: { from: "body", key: "show_id" },
    targetTable: "shows",
    targetIdKey: "show_id",
  },
  setlist_discourse_now_playing: {
    showRef: { from: "entry", key: "entry_id" },
    targetTable: "setlist_entries",
    targetIdKey: "entry_id",
  },

  // ─── Archive-wide dictionaries: insert only, never update ─────────────────
  songs_insert: {
    payloadKey: "row",
    columns: ["song", "song_displayname", "song_originalartist", "song_category"],
    targetTable: "songs",
  },
  guests_insert_new: {
    // Payload is read from top-level body fields, not a nested object, and the
    // handler only reads four known keys — so there is nothing to whitelist.
    // Category is pinned: brains offers no choice and must not be able to create
    // band members ("Goose (current)" / "Goose (former)") or groups.
    force: { guest_category: "Guest" },
    targetTable: "guests",
  },
  rpc_add_artist: {
    targetTable: "artists",
  },

  // ─── Stats rebuild ────────────────────────────────────────────────────────
  // Global, ~45s, and serialized by update_all_setlist_entries_locked().
  rpc_update_all_setlist_entries: {},
}

/**
 * Actions any signed-in user may call, always scoped to their own profile.
 *
 * `brains_my_assignments` is the query that DISCOVERS whether the caller has a
 * window, so it cannot itself require one — that would be circular. It is safe to
 * open because the caller never supplies the profile id: dpro-admin overwrites
 * `body.profile_id` with the value from the verified JWT before dispatch, so the
 * action can only ever return the caller's own rows. Without that overwrite this
 * would let anyone enumerate who is setlisting which show.
 */
export const SELF_SCOPED_ACTIONS: ReadonlySet<string> = new Set([
  "brains_my_assignments",
])

/**
 * Admin actions whose `created_by` is stamped from the verified JWT rather than
 * accepted from the request, so an assignment always records who really granted
 * it. Same principle as SELF_SCOPED_ACTIONS: identity comes from the token.
 */
export const ACTOR_STAMPED_ACTIONS: ReadonlySet<string> = new Set([
  "brains_assignments_insert",
])

/**
 * Actions that append to brains_audit_log, for admins as well as setlisters.
 *
 * Scoped to the brains action set rather than all 57 dpro-admin actions: logging
 * every admin call would bury the setlister history under bug lists, profile
 * counts and radio syncs. This keeps an apples-to-apples record for the shows
 * setlisters actually touch — `surface` separates who did what. Reads are
 * excluded; a lookup is not a change.
 */
export const BRAINS_AUDITED_ACTIONS: ReadonlySet<string> = new Set(
  Object.entries(SETLISTER_RULES)
    .filter(([, rule]) => !rule.readOnly)
    .map(([action]) => action),
)

/** The audit row's `target_table` / `target_id`, when the rule declares them. */
export function auditTarget(
  action: string,
  body: Record<string, unknown>,
): { targetTable: string | null; targetId: string | null } {
  const rule = SETLISTER_RULES[action]
  if (!rule) return { targetTable: null, targetId: null }
  const idKey = rule.targetIdKey
  const raw = idKey ? body[idKey] : null
  return {
    targetTable: rule.targetTable ?? null,
    targetId: typeof raw === "string" ? raw : null,
  }
}

export interface SetlisterGrant {
  allowed: true
  /** Null for archive-wide actions that carry no show. */
  showId: string | null
  assignmentId: string
  /** Prior row state for updates and deletes; null otherwise. */
  before: Record<string, unknown> | null
  /** Values to overwrite on the body before dispatch. */
  force: Record<string, unknown>
}

export interface SetlisterDenial {
  allowed: false
  status: number
  message: string
}

export type SetlisterDecision = SetlisterGrant | SetlisterDenial

function deny(message: string, status = 403): SetlisterDenial {
  return { allowed: false, status, message }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

/**
 * Resolve the show a call targets, and the prior row state where the lookup
 * needed to reach it happens to provide one.
 *
 * The `entry` and `entryList` branches select the whole row rather than just
 * `entry_show`, because the audit log wants a before-image for updates and
 * deletes and this is already the query that has to run.
 */
async function resolveShow(
  db: SupabaseClient,
  rule: SetlisterRule,
  body: Record<string, unknown>,
): Promise<
  | { ok: true; showId: string | null; before: Record<string, unknown> | null }
  | { ok: false; message: string }
> {
  const ref = rule.showRef
  if (!ref) return { ok: true, showId: null, before: null }

  if (ref.from === "body") {
    const id = body[ref.key]
    if (typeof id !== "string" || id.trim() === "") {
      return { ok: false, message: `Missing ${ref.key}` }
    }
    return { ok: true, showId: id, before: null }
  }

  if (ref.from === "row") {
    const row = asRecord(body[rule.payloadKey ?? "row"])
    const id = row?.[ref.key]
    if (typeof id !== "string" || id.trim() === "") {
      return { ok: false, message: `Missing ${ref.key}` }
    }
    return { ok: true, showId: id, before: null }
  }

  if (ref.from === "entry") {
    const entryId = body[ref.key]
    if (typeof entryId !== "string" || entryId.trim() === "") {
      return { ok: false, message: `Missing ${ref.key}` }
    }
    const { data, error } = await db
      .from("setlist_entries")
      .select("*")
      .eq("entry_id", entryId)
      .maybeSingle()
    if (error) return { ok: false, message: error.message }
    if (!data) return { ok: false, message: "Setlist entry not found" }
    const showId = (data as Record<string, unknown>).entry_show
    if (typeof showId !== "string") {
      return { ok: false, message: "Setlist entry has no show" }
    }
    return { ok: true, showId, before: data as Record<string, unknown> }
  }

  // entryList — a reorder. Every entry must belong to the same show, which is
  // then the show being authorized. A payload mixing shows is refused outright
  // rather than partially applied.
  const list = body[ref.key]
  if (!Array.isArray(list) || list.length === 0) {
    return { ok: false, message: `Missing ${ref.key}` }
  }
  const ids: string[] = []
  for (const item of list) {
    const rec = asRecord(item)
    const id = rec?.[ref.idField]
    if (typeof id !== "string" || id.trim() === "") {
      return { ok: false, message: `Each entry needs ${ref.idField}` }
    }
    ids.push(id)
  }
  const { data, error } = await db
    .from("setlist_entries")
    .select("entry_id, entry_set, entry_setnum, entry_show")
    .in("entry_id", ids)
  if (error) return { ok: false, message: error.message }
  const rows = (data ?? []) as Record<string, unknown>[]
  if (rows.length !== ids.length) {
    return { ok: false, message: "One or more entries not found" }
  }
  const shows = new Set(rows.map((r) => r.entry_show as string))
  if (shows.size !== 1) {
    return { ok: false, message: "Entries span more than one show" }
  }
  const showId = [...shows][0]
  if (typeof showId !== "string") {
    return { ok: false, message: "Entries have no show" }
  }
  return { ok: true, showId, before: { entries: rows } }
}

/** Refuse any column the caller may not write, naming the first offender. */
function checkColumns(
  rule: SetlisterRule,
  body: Record<string, unknown>,
): SetlisterDenial | null {
  if (!rule.payloadKey || !rule.columns) return null
  const payload = asRecord(body[rule.payloadKey])
  if (!payload) return deny(`Missing ${rule.payloadKey}`, 400)
  const allowed = new Set<string>(rule.columns)
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) continue
    if (!allowed.has(key)) {
      return deny(`Not permitted to set ${key}`)
    }
  }
  return null
}

/**
 * Decide whether a non-admin caller may run `action` with `body`.
 *
 * Order matters: the action must be listed, the payload must be clean, and only
 * then is the assignment checked. Cheap structural refusals therefore never
 * reach the database, and the expensive lookup runs once.
 */
export async function authorizeSetlister(
  db: SupabaseClient,
  profileId: string,
  action: string,
  body: Record<string, unknown>,
): Promise<SetlisterDecision> {
  const rule = SETLISTER_RULES[action]
  if (!rule) return deny("Forbidden")

  const columnDenial = checkColumns(rule, body)
  if (columnDenial) return columnDenial

  const resolved = await resolveShow(db, rule, body)
  if (!resolved.ok) return deny(resolved.message, 400)

  const { data: assignmentId, error } = await db.rpc("brains_active_assignment", {
    p_profile_id: profileId,
    p_show_id: resolved.showId,
  })
  if (error) return deny(error.message, 500)
  if (typeof assignmentId !== "string" || assignmentId === "") {
    return deny(
      resolved.showId
        ? "You do not have edit access to this show right now."
        : "Your editing window is not open.",
    )
  }

  return {
    allowed: true,
    showId: resolved.showId,
    assignmentId,
    before: resolved.before,
    force: rule.force ?? {},
  }
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface BrainsAuditEntry {
  actorProfileId: string | null
  actorUsername: string
  assignmentId?: string | null
  showId?: string | null
  showLabel?: string | null
  surface: "brains" | "admin"
  action: string
  targetTable?: string | null
  targetId?: string | null
  before?: unknown
  after?: unknown
  outcome: "success" | "denied" | "error"
}

/**
 * Append one row to brains_audit_log.
 *
 * Never throws. A failed audit insert is logged to console.error and the caller's
 * action still stands — during a live show, refusing a setlist entry because the
 * audit table hiccuped is worse than a gap in the log. Denials and errors are
 * recorded as well as successes; a refused write is the clearest signal of either
 * misuse or a UI bug.
 */
export async function writeBrainsAudit(
  db: SupabaseClient,
  entry: BrainsAuditEntry,
): Promise<void> {
  try {
    const { error } = await db.from("brains_audit_log").insert({
      actor_profile_id: entry.actorProfileId,
      actor_username: entry.actorUsername,
      assignment_id: entry.assignmentId ?? null,
      show_id: entry.showId ?? null,
      show_label: entry.showLabel ?? null,
      surface: entry.surface,
      action: entry.action,
      target_table: entry.targetTable ?? null,
      target_id: entry.targetId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      outcome: entry.outcome,
    })
    if (error) console.error("brains_audit_log insert:", error.message)
  } catch (err) {
    console.error("brains_audit_log insert threw:", err)
  }
}

/** `mm.dd.yy — group — subvenue` for the audit row's readable snapshot. */
export async function fetchShowLabel(
  db: SupabaseClient,
  showId: string | null,
): Promise<string | null> {
  if (!showId) return null
  const { data, error } = await db
    .from("shows")
    .select("show_date, show_group, show_subvenue")
    .eq("show_id", showId)
    .maybeSingle()
  if (error || !data) return null
  const row = data as Record<string, unknown>
  const date = typeof row.show_date === "string" ? row.show_date : null
  // show_date is a DATE column, always `yyyy-mm-dd` when present.
  const short = date
    ? `${date.slice(5, 7)}.${date.slice(8, 10)}.${date.slice(2, 4)}`
    : "??.??.??"
  return [short, row.show_group, row.show_subvenue]
    .filter((p) => typeof p === "string" && p !== "")
    .join(" — ")
}
