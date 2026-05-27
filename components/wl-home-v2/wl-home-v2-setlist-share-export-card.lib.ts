import { railLabelForEntrySet } from "@/components/wl-home-v2/wl-home-v2-setlist-table.utils"
import {
  formatSetlistDate,
  getEncoreLabel,
  shouldShowSetBreak,
} from "@/lib/setlist-utils"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import type { SetlistEntry, Show } from "@/types/setlist"

export type ShareExportRow = {
  entry: SetlistEntry
  index: number
  isFirstOfRun: boolean
  isLastOfRun: boolean
  runSpan: number
  railRowSpan: number
  railLabel: string | null
}

export type ShareExportDetailPillLine = { text: string; muted?: boolean }
export type ShareExportDetailPill = {
  key: string
  lines: ShareExportDetailPillLine[]
}

export function buildShareExportRows(
  setlist: SetlistEntry[],
  showDiscographySetUi: boolean,
  hasSinglePlacementType: boolean,
): ShareExportRow[] {
  const dividersBeforeEntryIndex = (entryIndex: number): number => {
    if (entryIndex <= 0) return 0
    let n = 0
    const prevEntry = setlist[entryIndex - 1]!
    const entry = setlist[entryIndex]!
    if (
      showDiscographySetUi &&
      !hasSinglePlacementType &&
      !!entry.entry_set?.startsWith("E") &&
      (!prevEntry.entry_set?.startsWith("E") ||
        prevEntry.entry_set !== entry.entry_set) &&
      !!getEncoreLabel(entry.entry_set)
    )
      n++
    if (
      showDiscographySetUi &&
      !hasSinglePlacementType &&
      shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)
    )
      n++
    return n
  }

  return setlist.map((entry, i) => {
    const isFirstOfRun =
      i === 0 || setlist[i - 1]!.entry_set !== entry.entry_set
    const isLastOfRun =
      i === setlist.length - 1 ||
      setlist[i + 1]!.entry_set !== entry.entry_set
    let runSpan = 1
    if (isFirstOfRun) {
      for (let j = i + 1; j < setlist.length; j++) {
        if (setlist[j]!.entry_set === entry.entry_set) runSpan++
        else break
      }
    }

    let railRowSpan = runSpan
    if (isFirstOfRun && runSpan > 1) {
      let dividerRowsBetweenSameSet = 0
      for (let j = i + 1; j < i + runSpan; j++) {
        dividerRowsBetweenSameSet += dividersBeforeEntryIndex(j)
      }
      railRowSpan = runSpan + dividerRowsBetweenSameSet
    }

    const railLabel =
      isFirstOfRun ?
        railLabelForEntrySet(entry.entry_set, runSpan)
      : null

    return {
      entry,
      index: i,
      isFirstOfRun,
      isLastOfRun,
      runSpan,
      railRowSpan,
      railLabel,
    }
  })
}

export function buildShareExportDetailPills(
  show: Show,
  showPositionInTour: ShowPositionInTour | null,
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
