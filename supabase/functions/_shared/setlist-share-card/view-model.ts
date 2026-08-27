/**
 * Builds the share card's view model from raw database rows.
 *
 * Pure — it takes rows and returns a {@link CardViewModel}, so it can be tested
 * without a database and reused by anything that already has the data. Fetching
 * lives in the edge function.
 */
import type { CardEntry, CardStatRow, CardViewModel } from "./card.ts"
import {
  prepareWlHomeV2ShareExportRichHtml,
  shouldShowSetlistEntryShort,
} from "./entry-display.ts"
import {
  buildShareExportDetailPills,
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
  type ShareExportShow,
  type ShareExportTourPosition,
} from "./show-details.ts"

/** The setlist row shape this reads, matching the card's select list. */
export type SetlistEntryRow = {
  entry_id: string | number
  entry_set: string | null
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string | null
  entry_coachnotes: string | null
  songs?: { song_displayname?: string | null } | null
}

export type ShowRow = ShareExportShow & {
  show_coachnotes?: string | null
  show_callbacks?: string | null
  show_rarity?: number | null
  show_gap?: number | null
  discography_display?: boolean | null
}

export type BuildViewModelOptions = {
  /** Per-entry coach notes under each song. Off for the public export. */
  showEntryCoachNotes?: boolean
  tourPosition?: ShareExportTourPosition | null
  /**
   * Rarity and average gap. Only wanted on the Instagram end-of-show image —
   * the per-song Bluesky card shows the poster instead.
   */
  includeStats?: boolean
  /** Data URI of the show poster, used when stats are omitted. */
  posterSrc?: string | null
}

/**
 * Strips the segue marker, keeping the entry.
 *
 * `entry_segue` is usually just ">" — the marker meaning "segues into the next
 * song" — and only sometimes carries a label after it. Returning null for the
 * bare marker (because stripping it leaves an empty string) is what made every
 * segue arrow disappear. Null means no segue; "" means draw a bare arrow.
 */
function cleanSegue(segue: string | null): string | null {
  const raw = segue?.trim()
  if (!raw) return null
  return raw.replace(/^>\s*/, "").trim()
}

function richOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? prepareWlHomeV2ShareExportRichHtml(trimmed) : null
}

function buildStatRows(show: ShowRow): CardStatRow[] {
  const rows: CardStatRow[] = []

  const rarityPct =
    show.show_rarity != null ? `${Number(show.show_rarity).toFixed(2)}%` : null
  if (rarityPct != null) {
    rows.push({
      label: "Show Rarity",
      value: rarityPct,
      background: getRarityPillBackground(rarityPct),
      borderColor: getRarityColor(rarityPct),
    })
  }

  if (show.show_gap != null) {
    rows.push({
      label: "Average Show Gap",
      value: Number(show.show_gap).toFixed(2),
      background: getGapPillBackground(show.show_gap),
      borderColor: getGapColor(show.show_gap),
    })
  }

  return rows
}

export function buildCardViewModel(
  show: ShowRow,
  setlist: SetlistEntryRow[],
  options: BuildViewModelOptions = {},
): CardViewModel {
  const entries: CardEntry[] = setlist.map((row) => ({
    entry_id: row.entry_id,
    entry_set: row.entry_set,
    songName: row.songs?.song_displayname?.trim() || row.entry_song || "",
    short:
      shouldShowSetlistEntryShort(row.entry_song, row.entry_short) ?
        row.entry_short?.trim() || null
      : null,
    segue: cleanSegue(row.entry_segue),
    coachHtml: richOrNull(row.entry_coachnotes),
  }))

  const placements = new Set(setlist.map((e) => e.entry_placement))

  return {
    entries,
    detailPills: buildShareExportDetailPills(show, options.tourPosition ?? null),
    statRows: options.includeStats ? buildStatRows(show) : [],
    posterSrc: options.posterSrc ?? null,
    coachHtml: richOrNull(show.show_coachnotes),
    callbacksHtml: richOrNull(show.show_callbacks),
    showDiscographySetUi: show.discography_display !== false,
    hasSinglePlacementType: placements.size === 1,
    showEntryCoachNotes: options.showEntryCoachNotes ?? true,
  }
}

/**
 * Position of a show within its tour, matching `useShowPositionInTour`:
 * date ascending, then canonical id, then group name.
 */
export function computeTourPosition(
  showId: string,
  tourShows: Array<{
    show_id: string
    show_canonid: number | null
    show_date: string
    show_group: string | null
  }>,
): ShareExportTourPosition | null {
  if (tourShows.length === 0) return null
  const sorted = [...tourShows].sort((a, b) => {
    const tA = new Date(a.show_date).getTime()
    const tB = new Date(b.show_date).getTime()
    if (tA !== tB) return tA - tB
    const aC = a.show_canonid !== null
    const bC = b.show_canonid !== null
    if (aC && bC) return a.show_canonid! - b.show_canonid!
    if (aC) return -1
    if (bC) return 1
    return (a.show_group ?? "").localeCompare(b.show_group ?? "")
  })
  const idx = sorted.findIndex((s) => s.show_id === showId)
  return idx >= 0 ? { position: idx + 1, total: sorted.length } : null
}
