import type {
  SetlistEntry,
  Guest,
  GuestGroup,
  Show,
  ShowDate,
} from "@/types/setlist"
import { getPlacementBarColor } from "@/lib/placement-bar-color"

/** Tailwind classes for a personnel pill by guest_category (fully rounded). */
export function getPersonnelPillClassName(
  guestCategory: string | null | undefined,
): string {
  const base =
    "rounded-full px-1.5 py-0.5 text-[10px] font-medium"
  const cat = guestCategory?.trim()
  if (cat === "Goose (current)")
    return `${base} bg-wl-green/60 !text-white`
  if (cat === "Goose (former)")
    return `${base} bg-wl-green/30 !text-white`
  if (cat === "Group" || cat === "Guest")
    return `${base} bg-wl-orange/50 !text-white`
  return `${base} bg-muted !text-muted-foreground`
}

/** Same ordering as setlist personnel pills: canon id, then display name. */
export function sortGuestsForSetlistDisplay(guests: Guest[]): Guest[] {
  return [...guests].sort((a, b) => {
    const byCanon = a.guest_canonid - b.guest_canonid
    if (byCanon !== 0) return byCanon
    return a.guest_display_name.localeCompare(b.guest_display_name)
  })
}

export function getGuestColor(
  entry: SetlistEntry,
  guestGroups: GuestGroup[],
): string {
  if (!entry.guests || entry.guests.length === 0) return "transparent"

  const sortedGuests = sortGuestsForSetlistDisplay(entry.guests)
  const entryGuestKey = sortedGuests.map((g) => g.guest_canonid).join(",")

  const group = guestGroups.find((group) =>
    sortGuestsForSetlistDisplay(group.guests)
      .map((g) => g.guest_canonid)
      .join(",") === entryGuestKey
  )

  return group?.color ?? "transparent"
}

/** Ordinal suffix for rank (1st, 2nd, 3rd, 4th, 11th, 21st, etc.). */
function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th"
  const last = n % 10
  if (last === 1) return "st"
  if (last === 2) return "nd"
  if (last === 3) return "rd"
  return "th"
}

/** Tooltip text for show length rank (e.g. "Longest Goose show of all-time."). */
export function getLengthRankTooltipText(rank: number): string {
  if (rank <= 0 || rank > 25) return ""
  const ord = getOrdinalSuffix(rank)
  const ordWord =
    rank === 1
      ? "Longest"
      : rank === 2
        ? "Second-longest"
        : rank === 3
          ? "Third-longest"
          : rank === 4
            ? "Fourth-longest"
            : rank === 5
              ? "Fifth-longest"
              : rank === 6
                ? "Sixth-longest"
                : rank === 7
                  ? "Seventh-longest"
                  : rank === 8
                    ? "Eighth-longest"
                    : rank === 9
                      ? "Ninth-longest"
                      : `${rank}${ord}-longest`
  return `${ordWord} Goose show of all-time.`
}

/** Format date as "MMMM d, yyyy" in UTC (e.g. "March 15, 2024"). */
export function formatShowDateLong(dateInput: string | null | undefined): string {
  if (dateInput == null) return ""
  const date = new Date(dateInput.includes("T") ? dateInput : dateInput + "T00:00:00Z")
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** Placement bar color for setlist entries (home-style). */
export function getPlacementColor(placement: string | null | undefined): string {
  return getPlacementBarColor(placement)
}

/**
 * Formats a date for setlist display (MM.DD.YY).
 * Accepts YYYY-MM-DD, ISO strings, numeric timestamps, or already-formatted MM.DD.YY.
 * Returns the input or empty string if parsing fails (avoids NaN in UI).
 */
export function formatSetlistDate(dateInput: string | number | null | undefined): string {
  if (dateInput == null) return ""
  if (typeof dateInput === "number") {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return ""
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
    const day = date.getUTCDate().toString().padStart(2, "0")
    const year = date.getUTCFullYear().toString().slice(-2)
    return `${month}.${day}.${year}`
  }
  const s = String(dateInput).trim()
  if (!s) return ""
  // Already in MM.DD.YY or MM.DD.YYYY format from API — always emit two-digit year
  if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(s)) {
    const [mo, da, yr] = s.split(".")
    const y2 = yr.length === 4 ? yr.slice(-2) : yr.padStart(2, "0")
    return `${mo.padStart(2, "0")}.${da.padStart(2, "0")}.${y2}`
  }
  // Parse: use as-is if ISO (contains T), otherwise append T00:00:00Z for date-only
  const date = new Date(s.includes("T") ? s : s + "T00:00:00Z")
  const time = date.getTime()
  if (Number.isNaN(time)) return s
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
  return `${month}.${day}.${year}`
}

/**
 * UTC weekday name for a show date (e.g. YYYY-MM-DD → "WEDNESDAY").
 * Matches {@link formatSetlistDate} calendar-day parsing (date-only strings use UTC).
 */
export function formatShowWeekday(
  dateInput: string | number | null | undefined,
): string {
  if (dateInput == null) return ""
  if (typeof dateInput === "number") {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return ""
    return date
      .toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
      .toUpperCase()
  }
  const s = String(dateInput).trim()
  if (!s) return ""
  const date = new Date(s.includes("T") ? s : `${s}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return ""
  return date
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
    .toUpperCase()
}

/**
 * Show date as MM.DD.YYYY (four-digit year), UTC — for WTED catalog and similar.
 */
export function formatShowDateLongYear(
  dateInput: string | number | null | undefined,
): string {
  if (dateInput == null) return ""
  if (typeof dateInput === "number") {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return ""
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
    const day = date.getUTCDate().toString().padStart(2, "0")
    const year = date.getUTCFullYear().toString()
    return `${month}.${day}.${year}`
  }
  const s = String(dateInput).trim()
  if (!s) return ""
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
    const [mo, da, yr] = s.split(".")
    return `${mo!.padStart(2, "0")}.${da!.padStart(2, "0")}.${yr}`
  }
  if (/^\d{1,2}\.\d{1,2}\.\d{2}$/.test(s)) {
    const [mo, da, yr2] = s.split(".")
    const yNum = Number.parseInt(yr2!, 10)
    const fullYear =
      yNum >= 70 ? 1900 + yNum : 2000 + yNum
    return `${mo!.padStart(2, "0")}.${da!.padStart(2, "0")}.${fullYear}`
  }
  const date = new Date(s.includes("T") ? s : s + "T00:00:00Z")
  const time = date.getTime()
  if (Number.isNaN(time)) return s
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString()
  return `${month}.${day}.${year}`
}

export function calculateShowPosition(
  show: Show,
  showDates: ShowDate[],
): { current: number; total: number; prevShowId: string | null; nextShowId: string | null } | null {
  if (!show || !showDates.length) return null

  const sortedShows = [...showDates].sort((a, b) => {
    const dateA = new Date(a.show_date).getTime()
    const dateB = new Date(b.show_date).getTime()
    if (dateA !== dateB) return dateA - dateB
    const aHasCanonid = a.show_canonid !== null
    const bHasCanonid = b.show_canonid !== null
    if (aHasCanonid && bHasCanonid) return a.show_canonid! - b.show_canonid!
    if (aHasCanonid && !bHasCanonid) return -1
    if (!aHasCanonid && bHasCanonid) return 1
    return (a.show_group ?? "").localeCompare(b.show_group ?? "")
  })

  const currentIndex = sortedShows.findIndex((s) => s.show_id === show.show_id)
  const prevShowId =
    currentIndex > 0 ? sortedShows[currentIndex - 1].show_id : null
  const nextShowId =
    currentIndex < sortedShows.length - 1 && currentIndex >= 0
      ? sortedShows[currentIndex + 1].show_id
      : null

  return {
    current: currentIndex + 1,
    total: sortedShows.length,
    prevShowId,
    nextShowId,
  }
}

function parseLengthToSeconds(length: string | null): number {
  if (!length) return 0
  const parts = length.split(":").map((part) => parseInt(part, 10))
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0)
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return (minutes || 0) * 60 + (seconds || 0)
  }
  return 0
}

export function formatEntryLength(length: string | null): string {
  if (!length) return ""
  const parts = length.split(":").map((part) => parseInt(part, 10))
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    if (hours === 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
  return length
}

/**
 * Format a length string for show-style display: omit `0` hours; under an hour, minutes are
 * not zero-padded; with hours, minutes and seconds are two digits (e.g. `45:30`, `1:09:41`).
 */
export function formatLengthAsHmmss(length: string | null | undefined): string {
  if (length == null || length === "") return ""
  const parts = length.split(":").map((p) => parseInt(p, 10))
  let totalSeconds = 0
  if (parts.length === 3) {
    totalSeconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
  } else if (parts.length === 2) {
    totalSeconds = (parts[0] || 0) * 60 + (parts[1] || 0)
  } else if (parts.length === 1 && !Number.isNaN(parts[0])) {
    totalSeconds = parts[0]
  } else {
    return length
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const sec = seconds.toString().padStart(2, "0")
  if (hours === 0) {
    return `${minutes}:${sec}`
  }
  return `${hours}:${minutes.toString().padStart(2, "0")}:${sec}`
}

export function totalSetlistLength(entries: { entry_length: string | null }[]): string {
  let totalSeconds = 0
  for (const e of entries) {
    totalSeconds += parseLengthToSeconds(e.entry_length)
  }
  if (totalSeconds === 0) return ""
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const sec = seconds.toString().padStart(2, "0")
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${sec}`
  }
  return `${minutes}:${sec}`
}

export function calculateRarity(
  timesPlayed: number | null,
  showsSinceDebut: number | null,
): string {
  if (!timesPlayed || !showsSinceDebut || showsSinceDebut === 0) return ""
  const percentage = (timesPlayed / showsSinceDebut) * 100
  return Math.round(percentage) + "%"
}

/** Main sets only (numeric set id); encores E1, E2, E3 are not main. */
export function isMainSet(set: string | null | undefined): boolean {
  if (!set) return false
  const s = String(set).trim()
  if (!/^\d+$/.test(s)) return false
  return Number.parseInt(s, 10) >= 1
}

/** Show Set Break bar between two different main sets (e.g. Set 1 → Set 2). */
export function shouldShowSetBreak(
  prevSet: string | null | undefined,
  currSet: string | null | undefined,
): boolean {
  return (
    isMainSet(prevSet) &&
    isMainSet(currSet) &&
    String(prevSet) !== String(currSet)
  )
}

/** Encore bar label from entry_set (E1, E2, E3). Returns "" for unknown. */
export function getEncoreLabel(entrySet: string | null | undefined): string {
  if (!entrySet) return ""
  const s = String(entrySet)
  if (s === "E1") return "Encore"
  if (s === "E2") return "2nd Encore"
  if (s === "E3") return "3rd Encore"
  return ""
}

export type SetlistSegmentLength = {
  /** Raw `entry_set` key (for React keys). */
  setKey: string
  label: string
  lengthHmmss: string
}

/** Sort key: main numeric sets (0), then encores E1/E2/… (1), then anything else (2). */
function entrySetSortRank(key: string): readonly [group: number, num: number, tie: string] {
  const s = String(key).trim()
  const encore = /^E(\d+)$/i.exec(s)
  if (encore) {
    return [1, parseInt(encore[1], 10), s.toUpperCase()]
  }
  if (/^\d+$/.test(s)) {
    return [0, parseInt(s, 10), s]
  }
  return [2, 0, s]
}

function compareEntrySetKeys(a: string, b: string): number {
  const [ga, na, sa] = entrySetSortRank(a)
  const [gb, nb, sb] = entrySetSortRank(b)
  if (ga !== gb) return ga - gb
  if (na !== nb) return na - nb
  return sa.localeCompare(sb, undefined, { sensitivity: "base" })
}

/**
 * Sum of `entry_length` per distinct `entry_set`. Rows are ordered by ascending `entry_set`
 * (numeric main sets, then E1/E2/… encores, then other keys lexicographically).
 */
export function getSetlistSegmentLengths(
  entries: {
    entry_set: string
    entry_length: string | null
    entry_setorder: number
  }[],
): SetlistSegmentLength[] {
  if (!entries.length) return []
  const sorted = [...entries].sort((a, b) => a.entry_setorder - b.entry_setorder)
  const secondsBySet = new Map<string, number>()
  for (const e of sorted) {
    const key = String(e.entry_set ?? "").trim()
    if (!key) continue
    if (!secondsBySet.has(key)) {
      secondsBySet.set(key, 0)
    }
    secondsBySet.set(
      key,
      (secondsBySet.get(key) ?? 0) + parseLengthToSeconds(e.entry_length),
    )
  }
  const setKeys = [...secondsBySet.keys()].sort(compareEntrySetKeys)
  return setKeys.map((key) => {
    const secs = secondsBySet.get(key) ?? 0
    return {
      setKey: key,
      label: setlistSegmentLabel(key),
      lengthHmmss:
        secs > 0 ? formatLengthAsHmmss(String(secs)) : "",
    }
  })
}

function setlistSegmentLabel(entrySet: string): string {
  const s = String(entrySet).trim()
  if (s.startsWith("E")) {
    const enc = getEncoreLabel(s)
    return enc || s
  }
  if (/^\d+$/.test(s)) return `Set ${s}`
  return s
}

export function getRarityColor(percentage: string | null): string {
  if (!percentage || percentage === "-" || percentage === "") return "transparent"
  const numericPercentage = parseFloat(percentage.replace("%", ""))
  if (Number.isNaN(numericPercentage)) return "transparent"
  const colorStops = [
    { percent: 0, color: { r: 156, g: 12, b: 12 } },
    { percent: 12, color: { r: 230, g: 81, b: 0 } },
    { percent: 24, color: { r: 179, g: 135, b: 0 } },
    { percent: 50, color: { r: 46, g: 125, b: 50 } },
    { percent: 100, color: { r: 13, g: 71, b: 161 } },
  ]
  let lowerStop = colorStops[0]
  let upperStop = colorStops[colorStops.length - 1]
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (
      numericPercentage >= colorStops[i].percent &&
      numericPercentage <= colorStops[i + 1].percent
    ) {
      lowerStop = colorStops[i]
      upperStop = colorStops[i + 1]
      break
    }
  }
  const range = upperStop.percent - lowerStop.percent
  const factor =
    range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0
  const r = Math.round(
    lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r),
  )
  const g = Math.round(
    lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g),
  )
  const b = Math.round(
    lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b),
  )
  return `rgb(${r}, ${g}, ${b})`
}

/** Same rgb mix as `getRarityColor`, with alpha on the fill (default 70%). */
export function getRarityPillBackground(percentage: string | null, alpha = 0.4): string {
  const base = getRarityColor(percentage)
  if (base === "transparent" || !base.startsWith("rgb(")) return base
  const m = base.match(
    /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i,
  )
  if (!m) return base
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`
}

/** Gap color: 0 = blue (best), 100 = red (worst). Same stops as rarity, reversed. */
export function getGapColor(value: string | number | null): string {
  if (value == null || value === "" || value === "-") return "transparent"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "transparent"
  const cappedValue = Math.min(num, 100)
  const colorStops = [
    { percent: 0, color: { r: 13, g: 71, b: 161 } },
    { percent: 12, color: { r: 46, g: 125, b: 50 } },
    { percent: 24, color: { r: 179, g: 135, b: 0 } },
    { percent: 50, color: { r: 230, g: 81, b: 0 } },
    { percent: 100, color: { r: 156, g: 12, b: 12 } },
  ]
  let lowerStop = colorStops[0]
  let upperStop = colorStops[colorStops.length - 1]
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (
      cappedValue >= colorStops[i].percent &&
      cappedValue <= colorStops[i + 1].percent
    ) {
      lowerStop = colorStops[i]
      upperStop = colorStops[i + 1]
      break
    }
  }
  const range = upperStop.percent - lowerStop.percent
  const factor =
    range !== 0 ? (cappedValue - lowerStop.percent) / range : 0
  const r = Math.round(
    lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r),
  )
  const g = Math.round(
    lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g),
  )
  const b = Math.round(
    lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b),
  )
  return `rgb(${r}, ${g}, ${b})`
}

/** Translucent fill from `getGapColor`, matching `getRarityPillBackground` treatment. */
export function getGapPillBackground(
  value: string | number | null,
  alpha = 0.4,
): string {
  const base = getGapColor(value)
  if (base === "transparent" || !base.startsWith("rgb(")) return base
  const m = base.match(
    /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i,
  )
  if (!m) return base
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`
}
