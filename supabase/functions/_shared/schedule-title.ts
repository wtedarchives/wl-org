/**
 * Schedule-title formatting shared by the radio push functions — ports the same
 * rules the website (`resolveRadioScheduleSlotTitle`) and the iOS/tvOS apps use,
 * so a program reads identically in the app schedule and in notifications.
 */

/** Bullet divider (plain single spaces; NBSP only matters for HTML/wrapping). */
const DIVIDER = " · "

/** Shows whose title is `display_name` only (no `show` prefix). */
const DISPLAY_NAME_ONLY_SHOWS = new Set([
  "Miscellaneous",
  "Show Airings",
  "requesTED",
  "Mixes",
])

function joinParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join(DIVIDER)
}

/** Drop a venue field that contains "Unknown" (case-insensitive) anywhere. */
function venuePart(value: string | null | undefined): string | null {
  const t = (value ?? "").trim()
  if (!t || /unknown/i.test(t)) return null
  return t
}

/** Date-only string → `mm.dd.yy` (UTC calendar day). */
function mmddyy(raw: string | null | undefined): string {
  if (!raw) return ""
  const d = new Date(`${String(raw).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return String(raw)
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const yy = String(d.getUTCFullYear()).slice(-2)
  return `${mm}.${dd}.${yy}`
}

export interface LinkedShowFields {
  show_date: string | null
  show_group: string | null
  show_detail: string | null
  show_venue_location: string | null
  show_subvenue: string | null
}

/** Linked show → `mm.dd.yy · group · detail · location · venue`
 * (empty parts omitted; venue parts containing "Unknown" dropped). */
export function formatLinkedShowScheduleTitle(show: LinkedShowFields): string {
  return joinParts([
    mmddyy(show.show_date),
    show.show_group,
    show.show_detail,
    venuePart(show.show_venue_location),
    venuePart(show.show_subvenue),
  ])
}

/** Multi-show program → `show · display_name`, or `display_name` only for the
 * display-name-only buckets. */
export function formatEpisodeScheduleTitle(
  show: string | null | undefined,
  displayName: string | null | undefined,
): string {
  const s = (show ?? "").trim()
  const dn = (displayName ?? "").trim()
  if (DISPLAY_NAME_ONLY_SHOWS.has(s)) return dn
  if (s && dn) return joinParts([s, dn])
  return dn || s
}
