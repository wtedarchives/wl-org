/**
 * Builds the TRMNL device payload from raw upstream rows.
 *
 * Pure — it takes Radio.co responses plus (optionally) a live show and its
 * setlist, and returns the exact JSON the device polls for. Fetching lives in
 * the edge function; the dev preview page calls this same builder so what you
 * see on the site is byte-for-byte what TRMNL renders.
 *
 * Imported by BOTH runtimes, like `../setlist-share-card/set-grouping.ts`:
 *
 *   - the Next app, via `@/supabase/functions/_shared/trmnl-feed/payload`
 *   - the Deno edge function, via a relative `../_shared/trmnl-feed/payload.ts`
 *
 * The screen is always two columns. The LEFT column is now-playing on the radio
 * and never branches. Only the RIGHT column switches: today's radio schedule
 * normally, that show's setlist when a Goose show is inside its live window.
 * `right` names which one, so the Liquid template branches in one place.
 */
import { shouldShowSetlistEntryShort } from "../setlist-share-card/entry-display.ts"
import { getEncoreLabel } from "../setlist-share-card/set-grouping.ts"

/** Station timezone. "Today's schedule" rolls over here, not at UTC midnight. */
export const TRMNL_DEFAULT_TZ = "America/New_York"

/**
 * The live window, matching `LiveShowMonitor.swift` and the `la-start-scan` /
 * `la_on_setlist_change` rules in `20260718120100_live_activity_pushes.sql`.
 * A show is live from `show_time` until six hours later.
 */
export const TRMNL_LIVE_WINDOW_MS = 6 * 60 * 60 * 1000

/** Logged alongside the song it came out of, so it is never "now playing". */
const IMPROV_JAM = "[Improv/Jam]"

/** Consecutive same-title rows merge when back-to-back (Radio.co artifacts). */
const BACK_TO_BACK_MS_TOLERANCE = 5000

export type TrmnlRightMode = "schedule" | "setlist"

/** How tight the right column has to pack to fit. See {@link densityForCount}. */
export type TrmnlDensity = "normal" | "compact" | "tight"

export type TrmnlNowPlaying = {
  /** Song, or the whole title when it does not parse. */
  primary: string
  /** Artist and/or the source show's date + venue. */
  secondary: string | null
  /**
   * Cover for the track on air, resolved by the caller with the same chain the
   * header player uses (custom Radio.co art, then the concert's release cover,
   * then the airing episode's artwork). Null means draw no image — the panel is
   * 1-bit, so a missing cover looks better as space than as a grey box.
   */
  artwork: string | null
}

export type TrmnlOnAir = {
  title: string
  /** Local range, e.g. `9:00 PM – 11:00 PM`. */
  time: string
}

export type TrmnlScheduleRow = {
  /** Local start, e.g. `9:00 PM`. */
  time: string
  title: string
  /** The slot `now` falls inside. At most one row is true. */
  now: boolean
}

export type TrmnlSetlistEntry = {
  song: string
  /** `[entry_short]`, already gated by `shouldShowSetlistEntryShort`. */
  short: string | null
  /**
   * `entry_segue` with the bare `>` marker stripped — the same three-state
   * convention the share card uses: `null` no segue, `""` a bare arrow, text a
   * labelled one. It maps onto Liquid for free, where only `nil` and `false`
   * are falsy and `""` is truthy, so `{% if e.segue %}→{{ e.segue }}{% endif %}`
   * is correct in all three cases.
   */
  segue: string | null
  /** The most recent real entry — what the NOW pill marks. */
  now: boolean
}

export type TrmnlSet = {
  /** `Set 1`, `Encore`, `2nd Encore`. */
  label: string
  entries: TrmnlSetlistEntry[]
}

export type TrmnlLive = {
  show_id: string
  /** `mm.dd.yy`, UTC calendar day (show dates are date-only). */
  date: string
  venue: string
  location: string
  tour: string | null
  sets: TrmnlSet[]
  entry_count: number
}

export type TrmnlPayload = {
  right: TrmnlRightMode
  generated_at: string
  tz: string
  /** How hard the template has to pack whichever right column is showing. */
  density: TrmnlDensity
  /** Left column. Present whichever mode the right column is in. */
  now_playing: TrmnlNowPlaying | null
  /** Left column: the program on air, from the schedule. */
  on_air: TrmnlOnAir | null
  /** Right column when `right` is `schedule`; `[]` otherwise. */
  schedule: TrmnlScheduleRow[]
  /** Right column when `right` is `setlist`; `null` otherwise. */
  live: TrmnlLive | null
}

/* ------------------------------------------------------------------ inputs */

export type RadioCoStatusInput = {
  current_track?: { title?: string | null } | null
  history?: Array<{ title?: string | null }> | null
}

export type RadioCoScheduleEventInput = {
  start: string
  end: string
  playlist: {
    /** `wted_episodes.episode` join key. */
    name?: string | null
    title?: string | null
    /** Path carries the playlist id, used when the name lookup misses. */
    artwork?: string | null
  }
}

/** `shows` columns the live query selects. */
export type TrmnlShowInput = {
  show_id: string
  show_date: string | null
  show_tour: string | null
  show_subvenue: string | null
  show_venue_location: string | null
}

/** `setlist_entries` columns the live query selects. */
export type TrmnlSetlistEntryInput = {
  entry_set: string | null
  entry_setnum: number | null
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  entry_setorder: number | null
  /** Joined `songs` row; its display name wins over `entry_song`. */
  songs?: { song_displayname?: string | null } | null
}

/**
 * One merged slot on the local day, before its title is resolved.
 *
 * `buildTrmnlPayload` takes these rather than raw Radio.co events because the
 * display title comes from `wted_episodes` — a database lookup keyed on
 * `playlistName` (and `artworkUrl`, which carries the playlist id as a
 * fallback). Callers select slots, resolve titles, then build.
 */
export type TrmnlScheduleSlot = {
  /** Radio.co `playlist.name`, the `wted_episodes.episode` join key. */
  playlistName: string
  /** Radio.co `playlist.title`, the last-resort label. */
  playlistTitle: string
  /** Radio.co `playlist.artwork`; its path carries the playlist id. */
  artworkUrl: string
  displayStart: number
  displayEnd: number
  actualStart: number
  actualEnd: number
}

export type BuildTrmnlPayloadInput = {
  status: RadioCoStatusInput | null
  /** From {@link selectScheduleSlots}. */
  slots: TrmnlScheduleSlot[]
  /**
   * Display title per slot, index-aligned with `slots`. A null entry falls back
   * to the Radio.co playlist name, matching `resolveRadioScheduleSlotTitle`.
   */
  slotTitles: Array<string | null>
  /** Cover for the track on air; see {@link TrmnlNowPlaying.artwork}. */
  trackArtwork: string | null
  show: TrmnlShowInput | null
  setlist: TrmnlSetlistEntryInput[]
  nowMs: number
  tz: string
}

/* -------------------------------------------------------------- timezone */

/**
 * Offset of `tz` from UTC at `instant`, in ms.
 *
 * The site computes day boundaries with the *browser's* local day
 * (`startOfLocalCalendarDay`). In an edge function "local" is UTC, which would
 * roll "today's schedule" over at 8pm ET, so every boundary here is explicit.
 */
function zoneOffsetMs(instant: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant))
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? "0")
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  )
  return asUTC - instant
}

/** Midnight of the `tz` calendar day containing `instant`, as a UTC epoch ms. */
function startOfZonedDay(instant: number, tz: string): number {
  const offset = zoneOffsetMs(instant, tz)
  const local = new Date(instant + offset)
  const localMidnight = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  )
  // Re-read the offset at the candidate instant: on a DST boundary the offset
  // at midnight differs from the offset now, and the first guess is wrong.
  const guess = localMidnight - offset
  const corrected = zoneOffsetMs(guess, tz)
  return corrected === offset ? guess : localMidnight - corrected
}

function formatZonedTime(t: number, tz: string): string {
  if (Number.isNaN(t)) return ""
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(t))
}

/* ----------------------------------------------------------- left column */

/**
 * Radio.co now-playing title → song line + context line.
 *
 * Prefers live `current_track`, else the newest `history` row — the same
 * ordering as `getWtedNowPlayingTitle`.
 */
export function parseRadioNowPlayingTitle(
  raw: string,
): Omit<TrmnlNowPlaying, "artwork"> {
  const title = raw.trim()
  const dateMatch =
    /(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/.exec(title)

  if (dateMatch && dateMatch.index != null) {
    const head = title
      .slice(0, dateMatch.index)
      .replace(/[\s\-–—·]+$/u, "")
      .trim()
    const context = title.slice(dateMatch.index).trim()
    const dash = head.indexOf(" - ")
    const artist = dash >= 0 ? head.slice(0, dash).trim() : ""
    const song = dash >= 0 ? head.slice(dash + 3).trim() : head
    return {
      primary: song || title,
      secondary:
        artist && context ? `${artist} • ${context}`
        : context || artist || null,
    }
  }

  const parts = title
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length <= 1) return { primary: title, secondary: null }
  if (parts.length === 2) return { primary: parts[1]!, secondary: parts[0]! }
  return { primary: parts[1]!, secondary: parts.slice(2).join(" · ") }
}

function buildNowPlaying(
  status: RadioCoStatusInput | null,
): Omit<TrmnlNowPlaying, "artwork"> | null {
  const current = status?.current_track?.title?.trim()
  const raw = current || status?.history?.[0]?.title?.trim() || ""
  return raw ? parseRadioNowPlayingTitle(raw) : null
}

/* ---------------------------------------------------------- right: schedule */

/**
 * Slots whose start or end falls on the `tz` day, clipped to that day, with
 * consecutive same-title rows merged.
 *
 * Exported because the display title needs a `wted_episodes` lookup that this
 * module cannot do: callers select slots, resolve titles, then call
 * {@link buildTrmnlPayload} with both.
 */
export function selectScheduleSlots(
  events: RadioCoScheduleEventInput[],
  nowMs: number,
  tz: string,
): TrmnlScheduleSlot[] {
  const dayStart = startOfZonedDay(nowMs, tz)
  const dayEnd = startOfZonedDay(dayStart + 36 * 60 * 60 * 1000, tz)

  const clipped: TrmnlScheduleSlot[] = []
  for (const event of events) {
    const start = new Date(event.start).getTime()
    const end = new Date(event.end).getTime()
    if (Number.isNaN(start) || Number.isNaN(end)) continue

    const startsToday = start >= dayStart && start < dayEnd
    const endsToday = end >= dayStart && end < dayEnd
    if (!startsToday && !endsToday) continue

    const displayStart = start < dayStart ? dayStart : start
    const displayEnd = end > dayEnd ? dayEnd : end
    if (displayStart >= displayEnd) continue

    clipped.push({
      playlistName: (event.playlist?.name ?? "").trim(),
      playlistTitle: (event.playlist?.title ?? "").trim(),
      artworkUrl: (event.playlist?.artwork ?? "").trim(),
      displayStart,
      displayEnd,
      actualStart: start,
      actualEnd: end,
    })
  }
  clipped.sort((a, b) => a.displayStart - b.displayStart)

  // Collapse the consecutive same-title rows Radio.co emits for one program.
  // Matched on `playlist.title`, the same key the site merges on.
  const merged: TrmnlScheduleSlot[] = []
  let i = 0
  while (i < clipped.length) {
    const first = clipped[i]!
    let displayEnd = first.displayEnd
    let actualEnd = first.actualEnd
    let j = i + 1
    while (j < clipped.length) {
      const next = clipped[j]!
      const sameTitle = first.playlistTitle === next.playlistTitle
      const backToBack =
        Math.abs(next.displayStart - displayEnd) <= BACK_TO_BACK_MS_TOLERANCE
      if (!sameTitle || !backToBack) break
      displayEnd = next.displayEnd
      actualEnd = next.actualEnd
      j++
    }
    merged.push({ ...first, displayEnd, actualEnd })
    i = j
  }
  return merged
}

/** The slot containing `nowMs`, or null between programs. */
export function currentScheduleSlot(
  slots: TrmnlScheduleSlot[],
  nowMs: number,
): TrmnlScheduleSlot | null {
  return (
    slots.find((s) => nowMs >= s.actualStart && nowMs < s.actualEnd) ?? null
  )
}

/* ----------------------------------------------------------- right: setlist */

/** Sort key: main sets ascending, then encores, then anything else. */
function setSortRank(set: string): [group: number, num: number, tie: string] {
  const s = set.trim()
  const encore = /^E(\d+)$/i.exec(s)
  if (encore) return [1, Number.parseInt(encore[1]!, 10), s.toUpperCase()]
  if (/^\d+$/.test(s)) return [0, Number.parseInt(s, 10), s]
  return [2, 0, s]
}

function compareEntries(
  a: TrmnlSetlistEntryInput,
  b: TrmnlSetlistEntryInput,
): number {
  const [ga, na, ta] = setSortRank(String(a.entry_set ?? ""))
  const [gb, nb, tb] = setSortRank(String(b.entry_set ?? ""))
  if (ga !== gb) return ga - gb
  if (na !== nb) return na - nb
  if (ta !== tb) return ta.localeCompare(tb)
  return (a.entry_setnum ?? 0) - (b.entry_setnum ?? 0)
}

/** `Set 1`, `Encore`, `2nd Encore` — encore wording from the share card. */
function setLabel(entrySet: string): string {
  const s = entrySet.trim()
  if (s.startsWith("E")) return getEncoreLabel(s) || s
  if (/^\d+$/.test(s)) return `Set ${s}`
  return s
}

/**
 * `entry_segue` is usually the bare `>` marker meaning "segues into the next
 * song", and only sometimes carries a label after it. Same three states as
 * `cleanSegue` in the share card's view model.
 */
function cleanSegue(segue: string | null): string | null {
  const raw = segue?.trim()
  if (!raw) return null
  return raw.replace(/^>\s*/, "").trim()
}

/**
 * How hard the template has to pack to fit the right column.
 *
 * The right column is roughly 400x386px — 420 less the strip reserved for the
 * corner mark — or about 18 lines at a comfortable e-ink size. Past that the
 * template steps font size and line height down rather than dropping content,
 * so a long night still fits on one screen.
 */
export function densityForCount(lines: number): TrmnlDensity {
  if (lines <= 18) return "normal"
  if (lines <= 28) return "compact"
  return "tight"
}

/**
 * Characters that fit on one wrapped schedule line at `normal` density.
 *
 * The title sits in ~316px (the right column's 400px of content, less the 74px
 * time gutter and its gap) at 14px, and the panel's sans averages near 7px a
 * character. Only ever an estimate — it decides density, not layout, and the
 * browser does the actual wrapping.
 */
const SCHEDULE_TITLE_CHARS_PER_LINE = 45

/** Row padding and rule, as a fraction of a text line. */
const SCHEDULE_ROW_CHROME_LINES = 0.6

/** Wrapped line count for one title. */
function estimateWrappedLines(title: string): number {
  const len = title.trim().length
  if (len === 0) return 1
  return Math.ceil(len / SCHEDULE_TITLE_CHARS_PER_LINE)
}

/**
 * Schedule titles wrap rather than truncate, so a day of long show names costs
 * far more height than its row count suggests. Measure the wrapped lines.
 */
function scheduleDensity(rows: TrmnlScheduleRow[]): TrmnlDensity {
  const units = rows.reduce(
    (sum, row) => sum + estimateWrappedLines(row.title) + SCHEDULE_ROW_CHROME_LINES,
    0,
  )
  return densityForCount(Math.ceil(units))
}

function buildLive(
  show: TrmnlShowInput,
  setlist: TrmnlSetlistEntryInput[],
): TrmnlLive {
  const ordered = [...setlist].sort(compareEntries)

  // Improv jams are logged beside the song they came out of, so the newest
  // *real* entry is what is actually being played. Matches LiveShowMonitor.
  let nowKey: string | null = null
  for (const entry of ordered) {
    if (entry.entry_song === IMPROV_JAM) continue
    nowKey = `${entry.entry_set ?? ""}|${entry.entry_setnum ?? 0}`
  }

  const sets: TrmnlSet[] = []
  for (const entry of ordered) {
    const key = String(entry.entry_set ?? "")
    if (sets.length === 0 || sets[sets.length - 1]!.label !== setLabel(key)) {
      sets.push({ label: setLabel(key), entries: [] })
    }
    sets[sets.length - 1]!.entries.push({
      song: entry.songs?.song_displayname?.trim() || (entry.entry_song ?? "").trim(),
      short:
        shouldShowSetlistEntryShort(entry.entry_song, entry.entry_short) ?
          entry.entry_short!.trim()
        : null,
      segue: cleanSegue(entry.entry_segue),
      now: `${entry.entry_set ?? ""}|${entry.entry_setnum ?? 0}` === nowKey,
    })
  }

  return {
    show_id: show.show_id,
    date: formatShowDateShort(show.show_date),
    venue: (show.show_subvenue ?? "").trim(),
    location: (show.show_venue_location ?? "").trim(),
    tour: show.show_tour?.trim() || null,
    sets,
    entry_count: ordered.length,
  }
}

/** `yyyy-mm-dd` → `mm.dd.yy` (UTC — show dates are date-only). */
function formatShowDateShort(raw: string | null): string {
  if (!raw) return ""
  const d = new Date(`${String(raw).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return String(raw)
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const yy = String(d.getUTCFullYear()).slice(-2)
  return `${mm}.${dd}.${yy}`
}

/* ------------------------------------------------------------------ build */

/**
 * Display label for a slot.
 *
 * Mirrors `resolveRadioScheduleSlotTitle`: prefer the resolved `wted_episodes`
 * title, then Radio.co's playlist NAME, then its title. The site falls back to
 * the name rather than the title, so this does too.
 */
function slotTitle(slot: TrmnlScheduleSlot, resolved: string | null | undefined): string {
  return (
    resolved?.trim() || slot.playlistName || slot.playlistTitle || ""
  )
}

/** True when `show_time` puts the show inside its six-hour live window. */
export function isShowLive(showTime: string | null, nowMs: number): boolean {
  if (!showTime) return false
  const t = new Date(showTime).getTime()
  if (Number.isNaN(t)) return false
  return t <= nowMs && t >= nowMs - TRMNL_LIVE_WINDOW_MS
}

export function buildTrmnlPayload(input: BuildTrmnlPayloadInput): TrmnlPayload {
  const { status, slots, slotTitles, trackArtwork, show, setlist, nowMs, tz } =
    input

  const current = currentScheduleSlot(slots, nowMs)
  const currentIndex = current ? slots.indexOf(current) : -1

  const onAir: TrmnlOnAir | null =
    current ?
      {
        title: slotTitle(current, slotTitles[currentIndex]),
        time: `${formatZonedTime(current.displayStart, tz)} – ${formatZonedTime(current.displayEnd, tz)}`,
      }
    : null

  const live = show ? buildLive(show, setlist) : null

  // The right column only renders one of these, but the schedule stays cheap
  // and the left column never blanks when the mode flips mid-show.
  const scheduleRows: TrmnlScheduleRow[] =
    live ? []
    : slots.map((slot, i) => ({
        time: formatZonedTime(slot.displayStart, tz),
        title: slotTitle(slot, slotTitles[i]),
        now: nowMs >= slot.actualStart && nowMs < slot.actualEnd,
      }))

  const nowPlaying = buildNowPlaying(status)

  return {
    right: live ? "setlist" : "schedule",
    generated_at: new Date(nowMs).toISOString(),
    tz,
    density:
      live ?
        densityForCount(live.entry_count + live.sets.length)
      : scheduleDensity(scheduleRows),
    now_playing:
      nowPlaying ? { ...nowPlaying, artwork: trackArtwork } : null,
    on_air: onAir,
    schedule: scheduleRows,
    live,
  }
}
