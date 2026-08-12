/**
 * wted-brains access windows: the ±offsets, the countdown, and the local-time
 * conversions the assign form needs.
 *
 * The window is derived here only to PRE-FILL the assign form. Once saved it
 * lives on `brains_assignments.access_start` / `.access_end` and is never
 * recomputed — an admin can extend it for a show that ran long, and a later edit
 * to `shows.show_time` must not silently move somebody's live access.
 *
 * Nothing here is a security boundary. Every value is for display; the
 * authoritative check is `brains_active_assignment()`, which compares against the
 * database clock.
 */

/** Access opens this long before show time. */
export const BRAINS_WINDOW_BEFORE_MS = 2 * 60 * 60 * 1000

/** Access closes this long after show time. */
export const BRAINS_WINDOW_AFTER_MS = 6 * 60 * 60 * 1000

/** Countdown turns amber here. */
export const BRAINS_COUNTDOWN_WARN_MS = 30 * 60 * 1000

/** Countdown turns red here. */
export const BRAINS_COUNTDOWN_URGENT_MS = 5 * 60 * 1000

export interface BrainsWindow {
  accessStart: string
  accessEnd: string
}

/**
 * Suggested window for a show. Returns null when the show has no `show_time` —
 * true of 1,460 of 1,568 shows, so the assign form must let an admin type the
 * window instead of assuming one can be derived.
 */
export function deriveBrainsWindow(
  showTime: string | null | undefined,
): BrainsWindow | null {
  if (!showTime) return null
  const t = new Date(showTime).getTime()
  if (!Number.isFinite(t)) return null
  return {
    accessStart: new Date(t - BRAINS_WINDOW_BEFORE_MS).toISOString(),
    accessEnd: new Date(t + BRAINS_WINDOW_AFTER_MS).toISOString(),
  }
}

/** `h:mm:ss`, floored at zero. Windows are 8 hours, so hours never reach two digits. */
export function formatBrainsCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${h}:${pad(m)}:${pad(s)}`
}

export type BrainsCountdownTone = "normal" | "warn" | "urgent" | "expired"

export function brainsCountdownTone(msRemaining: number): BrainsCountdownTone {
  if (msRemaining <= 0) return "expired"
  if (msRemaining <= BRAINS_COUNTDOWN_URGENT_MS) return "urgent"
  if (msRemaining <= BRAINS_COUNTDOWN_WARN_MS) return "warn"
  return "normal"
}

/**
 * ISO instant → the `YYYY-MM-DDTHH:mm` an `<input type="datetime-local">` wants,
 * in the viewer's own timezone. Windows are always shown and entered in local
 * time so an admin is never mentally converting zones while a show is starting.
 */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

/**
 * `YYYY-MM-DDTHH:mm` from a datetime-local input → ISO instant.
 *
 * A date-time string with no offset is parsed as local time, which is what the
 * input means. Returns null for an unparseable or empty value so callers can
 * refuse to save rather than writing an Invalid Date.
 */
export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const t = new Date(trimmed).getTime()
  if (!Number.isFinite(t)) return null
  return new Date(t).toISOString()
}

/** `mm.dd.yy` from a `yyyy-mm-dd` DATE column. */
export function formatBrainsShowDate(showDate: string | null | undefined): string {
  if (!showDate || showDate.length < 10) return "??.??.??"
  return `${showDate.slice(5, 7)}.${showDate.slice(8, 10)}.${showDate.slice(2, 4)}`
}

/**
 * The show identity line: `mm.dd.yy — group — subvenue — venue location`.
 * Used by the brains context header and the admin assignment list so both name
 * a show the same way.
 */
export function formatBrainsShowLabel(show: {
  show_date?: string | null
  show_group?: string | null
  show_subvenue?: string | null
  show_venue_location?: string | null
} | null | undefined): string {
  if (!show) return "Unknown show"
  const parts = [
    formatBrainsShowDate(show.show_date),
    show.show_group,
    show.show_subvenue,
    show.show_venue_location,
  ]
  return parts
    .filter((p): p is string => typeof p === "string" && p.trim() !== "")
    .join(" — ")
}
