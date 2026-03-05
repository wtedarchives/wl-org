import type { SetlistEntry, GuestGroup, Show, ShowDate } from "@/types/setlist"

/** Tailwind classes for a personnel pill by guest_category (fully rounded). */
export function getPersonnelPillClassName(
  guestCategory: string | null | undefined,
): string {
  const base =
    "rounded-full px-1.5 py-0.5 text-[10px] font-medium"
  const cat = guestCategory?.trim()
  if (cat === "Goose (current)")
    return `${base} bg-wl-green/60 text-white`
  if (cat === "Goose (former)")
    return `${base} bg-wl-green/30 text-white`
  if (cat === "Group" || cat === "Guest")
    return `${base} bg-wl-orange/50 text-white`
  return `${base} bg-muted text-muted-foreground`
}

export function getGuestColor(
  entry: SetlistEntry,
  guestGroups: GuestGroup[],
): string {
  if (!entry.guests || entry.guests.length === 0) return "transparent"

  const sortedGuests = [...entry.guests].sort(
    (a, b) => a.guest_canonid - b.guest_canonid,
  )
  const entryGuestKey = sortedGuests.map((g) => g.guest_canonid).join(",")

  const group = guestGroups.find((group) =>
    group.guests
      .sort((a, b) => a.guest_canonid - b.guest_canonid)
      .map((g) => g.guest_canonid)
      .join(",") === entryGuestKey
  )

  return group?.color ?? "transparent"
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
  // Already in MM.DD.YY (or MM.DD.YYYY) format from API
  if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(s)) return s
  // Parse: use as-is if ISO (contains T), otherwise append T00:00:00Z for date-only
  const date = new Date(s.includes("T") ? s : s + "T00:00:00Z")
  const time = date.getTime()
  if (Number.isNaN(time)) return s
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
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

export function totalSetlistLength(entries: { entry_length: string | null }[]): string {
  let totalSeconds = 0
  for (const e of entries) {
    totalSeconds += parseLengthToSeconds(e.entry_length)
  }
  if (totalSeconds === 0) return ""
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function calculateRarity(
  timesPlayed: number | null,
  showsSinceDebut: number | null,
): string {
  if (!timesPlayed || !showsSinceDebut || showsSinceDebut === 0) return ""
  const percentage = (timesPlayed / showsSinceDebut) * 100
  return Math.round(percentage) + "%"
}

/** Main sets only (1–5); encores E1, E2, E3 are not main. */
export function isMainSet(set: string | null | undefined): boolean {
  if (!set) return false
  return ["1", "2", "3", "4", "5"].includes(String(set))
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
