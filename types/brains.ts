/**
 * wted-brains types. Mirrors the shapes returned by the `brains_*` actions in
 * the `dpro-admin` Edge Function.
 */

/** Show identity fields, embedded by the brains assignment queries. */
export interface BrainsShowRef {
  show_date: string | null
  show_group: string | null
  show_subvenue: string | null
  show_venue_location: string | null
}

/** Same, plus show_time — only the admin list needs it (window pre-fill). */
export interface BrainsShowRefWithTime extends BrainsShowRef {
  show_time: string | null
}

/** One of the caller's own windows, from `brains_my_assignments`. */
export interface BrainsMyAssignment {
  uuid: string
  show_id: string
  access_start: string
  access_end: string
  shows: BrainsShowRef | null
}

/**
 * `brains_my_assignments` response. `now` is the server's clock at the moment of
 * the reply; the client measures its offset from it once so the countdown cannot
 * be fooled by a wrong device clock.
 */
export interface BrainsMyAssignmentsResponse {
  now: string
  assignments: BrainsMyAssignment[]
}

/** One row of the admin assignment list, from `brains_assignments_list`. */
export interface BrainsAdminAssignment {
  uuid: string
  show_id: string
  profile_id: string
  access_start: string
  access_end: string
  revoked_at: string | null
  created_at: string
  profiles: { username: string | null } | null
  shows: BrainsShowRefWithTime | null
}

export interface BrainsAdminAssignmentsResponse {
  /** Server clock, so window states are labelled against it, not the device. */
  now: string
  assignments: BrainsAdminAssignment[]
}

/** One row of `brains_audit_log`, from `brains_audit_list`. */
export interface BrainsAuditRow {
  uuid: string
  created_at: string
  actor_profile_id: string | null
  actor_username: string
  show_id: string | null
  show_label: string | null
  surface: "brains" | "admin"
  action: string
  target_table: string | null
  target_id: string | null
  before: unknown
  after: unknown
  outcome: "success" | "denied" | "error"
}

export interface BrainsAuditResponse {
  entries: BrainsAuditRow[]
}

/** A show the assign form can offer, plus the show_time its window derives from. */
export interface BrainsAssignableShow {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string | null
  show_canonid: number | null
  show_time: string | null
}
