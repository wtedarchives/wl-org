/**
 * Admin show utilities. Store times in UTC, display in Eastern.
 */

/** Format date as MM.DD.YY (e.g. "03.15.24") for admin display. */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00Z")
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
  return `${month}.${day}.${year}`
}

/** Get display strings for show dropdown (date, canonId, location). */
export function getShowDisplayData(show: {
  show_date: string
  show_canonid?: number | null
  show_group?: string
  show_venue_location?: string | null
}) {
  const dateStr = formatDate(show.show_date)
  const canonIdStr = show.show_canonid ? ` [${show.show_canonid}]` : ""
  const locationStr = ` [${show.show_group ?? ""} – ${show.show_venue_location ?? "Unknown"}]`
  return { dateStr, canonIdStr, locationStr }
}

/** Convert UTC datetime to Eastern Time for display (YYYY-MM-DDTHH:MM). */
export function convertToEasternDisplay(utcDatetime: string | null): string {
  if (!utcDatetime) return ""

  const utcDate = new Date(utcDatetime)
  const easternDateString = utcDate.toLocaleString("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return easternDateString.replace(", ", "T")
}

/** Format time/interval for display (e.g. "5:23" or "1:5:30"). Removes leading zeroes except for seconds. */
export function formatTimeDisplay(interval: string | null): string {
  if (!interval) return ""
  const raw = interval.split(":")
  const nums = raw.map((p) => parseInt(p, 10) || 0)
  const nonZeroStart = nums.findIndex((n) => n !== 0)
  if (nonZeroStart === -1) return "0"
  const trimmed = raw.slice(nonZeroStart).map((p) => parseInt(p, 10) || 0)
  const formatted = trimmed.map((n, i) => {
    const isSeconds =
      (raw.length === 3 && nonZeroStart + i === 2) ||
      (raw.length === 2 && nonZeroStart + i === 1)
    return isSeconds ? String(n).padStart(2, "0") : String(n)
  })
  return formatted.join(":")
}

/** Header style for setlist save status. */
export function getHeaderStyle(
  saveStatus: "idle" | "processing" | "done" | "error"
): string {
  switch (saveStatus) {
    case "idle":
      return "bg-primary text-primary-foreground"
    case "processing":
      return "bg-muted-foreground text-muted"
    case "done":
      return "bg-green-600 text-white"
    case "error":
      return "bg-destructive text-destructive-foreground"
    default:
      return "bg-primary text-primary-foreground"
  }
}

/** Header text for setlist save status. */
export function getHeaderText(
  saveStatus: "idle" | "processing" | "done" | "error"
): string {
  switch (saveStatus) {
    case "idle":
      return "Setlist Management"
    case "processing":
      return "Saving..."
    case "done":
      return "Saved!"
    case "error":
      return "Error saving"
    default:
      return "Setlist Management"
  }
}

/** Convert Eastern Time input to UTC for storage. */
export function convertFromEasternToUTC(easternDatetime: string): string {
  if (!easternDatetime) return ""

  try {
    const [datePart, timePart] = easternDatetime.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    const [hour, minute] = (timePart ?? "00:00").split(":").map(Number)

    const testDate = new Date(year, month - 1, day)
    const easternOffset = testDate
      .toLocaleString("en", {
        timeZone: "America/New_York",
        timeZoneName: "short",
      })
      .includes("EDT")
      ? -4
      : -5

    const tempUtc = new Date(Date.UTC(year, month - 1, day, hour, minute))
    const utcDate = new Date(
      tempUtc.getTime() - easternOffset * 60 * 60 * 1000
    )
    return utcDate.toISOString()
  } catch {
    return ""
  }
}
