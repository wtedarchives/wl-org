/**
 * Show-level presentation helpers for the setlist share card.
 *
 * Like `./set-grouping.ts`, this is read by BOTH the Next app and the Deno edge
 * renderer, so it must stay self-contained — no `@/` aliases, no imports. The
 * web modules re-export from here to keep their existing import paths.
 *
 * These are pure formatting and colour-ramp functions moved from
 * `lib/setlist-utils.ts`; behaviour is unchanged.
 */

/** Minimal show shape these helpers read. `Show` satisfies it structurally. */
export type ShareExportShow = {
  show_date?: string | number | null
  show_group?: string | null
  show_tour?: string | null
  show_subvenue?: string | null
  show_venue_location?: string | null
}

/** Matches the `useShowPositionInTour` result shape. */
export type ShareExportTourPosition = {
  position: number
  total: number
}

export type ShareExportDetailPillLine = { text: string; muted?: boolean }
export type ShareExportDetailPill = {
  key: string
  lines: ShareExportDetailPillLine[]
}

type ColorStop = { percent: number; color: { r: number; g: number; b: number } }

/** Linear interpolation across a colour ramp, clamped to the stop range. */
function mixRamp(value: number, stops: ColorStop[]): string {
  let lower = stops[0]!
  let upper = stops[stops.length - 1]!
  for (let i = 0; i < stops.length - 1; i++) {
    if (value >= stops[i]!.percent && value <= stops[i + 1]!.percent) {
      lower = stops[i]!
      upper = stops[i + 1]!
      break
    }
  }
  const range = upper.percent - lower.percent
  const factor = range !== 0 ? (value - lower.percent) / range : 0
  const r = Math.round(lower.color.r + factor * (upper.color.r - lower.color.r))
  const g = Math.round(lower.color.g + factor * (upper.color.g - lower.color.g))
  const b = Math.round(lower.color.b + factor * (upper.color.b - lower.color.b))
  return `rgb(${r}, ${g}, ${b})`
}

/** Same rgb value with an alpha channel; passes `transparent` through. */
function withAlpha(base: string, alpha: number): string {
  if (base === "transparent" || !base.startsWith("rgb(")) return base
  const m = base.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  if (!m) return base
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`
}

const RARITY_STOPS: ColorStop[] = [
  { percent: 0, color: { r: 156, g: 12, b: 12 } },
  { percent: 12, color: { r: 230, g: 81, b: 0 } },
  { percent: 24, color: { r: 179, g: 135, b: 0 } },
  { percent: 50, color: { r: 46, g: 125, b: 50 } },
  { percent: 100, color: { r: 13, g: 71, b: 161 } },
]

/** Gap runs the opposite direction to rarity: low gap is good. */
const GAP_STOPS: ColorStop[] = [
  { percent: 0, color: { r: 13, g: 71, b: 161 } },
  { percent: 12, color: { r: 46, g: 125, b: 50 } },
  { percent: 24, color: { r: 179, g: 135, b: 0 } },
  { percent: 50, color: { r: 230, g: 81, b: 0 } },
  { percent: 100, color: { r: 156, g: 12, b: 12 } },
]

export function getRarityColor(percentage: string | null): string {
  if (!percentage || percentage === "-" || percentage === "") return "transparent"
  const numericPercentage = Number.parseFloat(percentage.replace("%", ""))
  if (Number.isNaN(numericPercentage)) return "transparent"
  return mixRamp(numericPercentage, RARITY_STOPS)
}

/** Same rgb mix as `getRarityColor`, with alpha on the fill. */
export function getRarityPillBackground(
  percentage: string | null,
  alpha = 0.4,
): string {
  return withAlpha(getRarityColor(percentage), alpha)
}

export function getGapColor(value: string | number | null): string {
  if (value == null || value === "" || value === "-") return "transparent"
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  if (Number.isNaN(num)) return "transparent"
  return mixRamp(Math.min(num, 100), GAP_STOPS)
}

/** Translucent fill from `getGapColor`, matching `getRarityPillBackground`. */
export function getGapPillBackground(
  value: string | number | null,
  alpha = 0.4,
): string {
  return withAlpha(getGapColor(value), alpha)
}

/** Always emits MM.DD.YY. Date-only strings are read as UTC calendar days. */
export function formatSetlistDate(
  dateInput: string | number | null | undefined,
): string {
  if (dateInput == null) return ""
  if (typeof dateInput === "number") {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return ""
    return utcParts(date)
  }
  const s = String(dateInput).trim()
  if (!s) return ""
  // Already MM.DD.YY or MM.DD.YYYY from the API — always emit a two-digit year.
  if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(s)) {
    const [mo, da, yr] = s.split(".") as [string, string, string]
    const y2 = yr.length === 4 ? yr.slice(-2) : yr.padStart(2, "0")
    return `${mo.padStart(2, "0")}.${da.padStart(2, "0")}.${y2}`
  }
  // ISO strings are used as-is; date-only strings get an explicit UTC midnight.
  const date = new Date(s.includes("T") ? s : `${s}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return s
  return utcParts(date)
}

function utcParts(date: Date): string {
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
  return `${month}.${day}.${year}`
}

/** The stacked detail pills down the card's aside: group/date, tour, venue. */
export function buildShareExportDetailPills(
  show: ShareExportShow,
  showPositionInTour: ShareExportTourPosition | null,
): ShareExportDetailPill[] {
  const dateStr = formatSetlistDate(show.show_date)
  const group = show.show_group?.trim()
  const tour = show.show_tour?.trim()
  const sub = show.show_subvenue?.trim()
  const loc = show.show_venue_location?.trim()

  const out: ShareExportDetailPill[] = []

  const groupDateLines: ShareExportDetailPillLine[] = []
  if (group) groupDateLines.push({ text: group })
  groupDateLines.push({ text: dateStr, muted: true })
  out.push({ key: "group-date", lines: groupDateLines })

  const tourLines: ShareExportDetailPillLine[] = []
  if (tour) tourLines.push({ text: tour })
  if (showPositionInTour) {
    tourLines.push({
      text: `Show ${showPositionInTour.position} of ${showPositionInTour.total}`,
      muted: true,
    })
  }
  if (tourLines.length > 0) out.push({ key: "tour-pos", lines: tourLines })

  const venueLines: ShareExportDetailPillLine[] = []
  if (sub) venueLines.push({ text: sub })
  if (loc) venueLines.push({ text: loc, muted: true })
  if (venueLines.length > 0) out.push({ key: "sub-loc", lines: venueLines })

  return out
}
