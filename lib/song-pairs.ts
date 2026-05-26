import {
  INDEX_SKIP_SHORTS,
  INDEX_SKIP_SONG_IMPROV_JAM,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { calculateRarity, totalSetlistLength } from "@/lib/setlist-utils"
import {
  getPlacementBarCssToken,
  type PlacementBarCssToken,
} from "@/lib/placement-bar-color"
import type { SetlistEntry } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

export function songPairSongNames(pair: SongPair): string[] {
  return [pair.song_1, pair.song_2, pair.song_3, pair.song_4].filter(
    (s): s is string => !!s?.trim(),
  )
}

/** True when `needle` appears as a sub-multiset of `haystack` (order-independent). */
function multisetContains(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0) return false
  const counts = new Map<string, number>()
  for (const x of haystack) counts.set(x, (counts.get(x) ?? 0) + 1)
  for (const y of needle) {
    const c = counts.get(y)
    if (!c) return false
    if (c === 1) counts.delete(y)
    else counts.set(y, c - 1)
  }
  return true
}

export function findSongPairMatchAtIndex(
  setlist: SetlistEntry[],
  startIndex: number,
  songPairs: SongPair[],
): { pair: SongPair; entries: SetlistEntry[]; endIndex: number } | null {
  const start = setlist[startIndex]
  if (!start) return null
  const setId = start.entry_set

  const sortedPairs = [...songPairs].sort(
    (a, b) => songPairSongNames(b).length - songPairSongNames(a).length,
  )

  for (const pair of sortedPairs) {
    const pairSongs = songPairSongNames(pair)
    if (pairSongs.length < 2) continue

    const pairSongSet = new Set(pairSongs)
    if (!pairSongSet.has(start.entry_song)) continue

    const entries: SetlistEntry[] = []
    for (let j = startIndex; j < setlist.length; j++) {
      const entry = setlist[j]!
      if (entry.entry_set !== setId) break
      if (!pairSongSet.has(entry.entry_song)) break
      entries.push(entry)
    }

    if (entries.length < pairSongs.length) continue

    const entrySongs = entries.map((e) => e.entry_song)
    if (!multisetContains(entrySongs, pairSongs)) continue

    return {
      pair,
      entries,
      endIndex: startIndex + entries.length - 1,
    }
  }

  return null
}

export function findSetlistSongPairRanges(
  setlist: SetlistEntry[],
  songPairs: SongPair[],
): Map<number, { pair: SongPair; entries: SetlistEntry[] }> {
  const ranges = new Map<number, { pair: SongPair; entries: SetlistEntry[] }>()
  let i = 0
  while (i < setlist.length) {
    const match = findSongPairMatchAtIndex(setlist, i, songPairs)
    if (match) {
      ranges.set(i, { pair: match.pair, entries: match.entries })
      i = match.endIndex + 1
    } else {
      i++
    }
  }
  return ranges
}

function isRepriseEntry(entry: SetlistEntry): boolean {
  if (entry.entry_short?.trim().toLowerCase() === "reprise") return true
  return entry.entry_song?.trim().toLowerCase() === "teaprise"
}

/** Synthetic pair for reprise-combined rows (no DB alt_name; song cell lists both entries). */
export const REPRISE_COMBINED_PAIR: SongPair = {
  uuid: "__reprise_combined__",
  song_1: "",
  song_2: "",
  song_3: null,
  song_4: null,
  alt_name: null,
}

/**
 * Preceding non-reprise entry plus one or more consecutive reprise rows (`entry_short`
 * reprise, or `entry_song` Teaprise) in the same set with sequential `entry_setnum`
 * values. Skips indices already covered by a song-pair match.
 */
export function findRepriseCombineRanges(
  setlist: SetlistEntry[],
  pairRanges: Map<number, { pair: SongPair; entries: SetlistEntry[] }>,
): Map<number, SetlistEntry[]> {
  const ranges = new Map<number, SetlistEntry[]>()
  let i = 1
  while (i < setlist.length) {
    const repriseEntry = setlist[i]!
    if (!isRepriseEntry(repriseEntry)) {
      i++
      continue
    }

    const prevIndex = i - 1
    if (pairRanges.has(prevIndex)) {
      i++
      continue
    }

    const prevEntry = setlist[prevIndex]!
    if (isRepriseEntry(prevEntry)) {
      i++
      continue
    }
    if (prevEntry.entry_set !== repriseEntry.entry_set) {
      i++
      continue
    }
    if (repriseEntry.entry_setnum !== prevEntry.entry_setnum + 1) {
      i++
      continue
    }

    const entries: SetlistEntry[] = [prevEntry, repriseEntry]
    let j = i + 1
    while (j < setlist.length) {
      const next = setlist[j]!
      const last = entries[entries.length - 1]!
      if (!isRepriseEntry(next)) break
      if (next.entry_set !== last.entry_set) break
      if (next.entry_setnum !== last.entry_setnum + 1) break
      entries.push(next)
      j++
    }

    ranges.set(prevIndex, entries)
    i = j
  }
  return ranges
}

export type SetlistTableRowItem =
  | { type: "single"; entry: SetlistEntry }
  | {
      type: "pair"
      pair: SongPair
      entries: SetlistEntry[]
      expandKey: string
    }
  | {
      type: "reprise"
      entries: SetlistEntry[]
      expandKey: string
    }

export function buildSetlistTableRows(
  setlist: SetlistEntry[],
  songPairs: SongPair[],
  expandedPairKeys: Set<string>,
): SetlistTableRowItem[] {
  const pairRanges =
    songPairs.length > 0 ?
      findSetlistSongPairRanges(setlist, songPairs)
    : new Map<number, { pair: SongPair; entries: SetlistEntry[] }>()
  const repriseRanges = findRepriseCombineRanges(setlist, pairRanges)

  if (pairRanges.size === 0 && repriseRanges.size === 0) {
    return setlist.map((entry) => ({ type: "single", entry }))
  }

  const items: SetlistTableRowItem[] = []
  let i = 0
  while (i < setlist.length) {
    const pairRange = pairRanges.get(i)
    if (pairRange) {
      const expandKey = pairRange.entries[0]!.entry_id
      if (expandedPairKeys.has(expandKey)) {
        for (const entry of pairRange.entries) {
          items.push({ type: "single", entry })
        }
      } else {
        items.push({
          type: "pair",
          pair: pairRange.pair,
          entries: pairRange.entries,
          expandKey,
        })
      }
      i += pairRange.entries.length
      continue
    }

    const repriseEntries = repriseRanges.get(i)
    if (repriseEntries) {
      const expandKey = repriseEntries[0]!.entry_id
      if (expandedPairKeys.has(expandKey)) {
        for (const entry of repriseEntries) {
          items.push({ type: "single", entry })
        }
      } else {
        items.push({
          type: "reprise",
          entries: repriseEntries,
          expandKey,
        })
      }
      i += repriseEntries.length
      continue
    }

    items.push({ type: "single", entry: setlist[i]! })
    i++
  }
  return items
}

function entrySkipsNumber(
  entry: SetlistEntry,
  songsNumbered: Set<string>,
): boolean {
  const short = entry.entry_short?.toLowerCase()
  const skipByShort =
    short != null && INDEX_SKIP_SHORTS.some((s) => s === short)
  const skipByImprovJam = entry.entry_song === INDEX_SKIP_SONG_IMPROV_JAM
  const skipByDuplicate = songsNumbered.has(entry.entry_song)
  return skipByShort || skipByImprovJam || skipByDuplicate
}

function entryWouldGetNumber(
  entry: SetlistEntry,
  songsNumbered: Set<string>,
): boolean {
  return !entrySkipsNumber(entry, songsNumbered)
}

export function computeDisplayNumbersForTableRows(
  rows: SetlistTableRowItem[],
): (number | null)[] {
  const result: (number | null)[] = []
  const songsNumbered = new Set<string>()
  let counter = 1

  for (const row of rows) {
    if (row.type === "single") {
      if (entrySkipsNumber(row.entry, songsNumbered)) {
        result.push(null)
      } else {
        result.push(counter)
        songsNumbered.add(row.entry.entry_song)
        counter += 1
      }
      continue
    }

    const shouldNumber = row.entries.some((entry) =>
      entryWouldGetNumber(entry, songsNumbered),
    )
    if (!shouldNumber) {
      result.push(null)
    } else {
      result.push(counter)
      for (const entry of row.entries) {
        songsNumbered.add(entry.entry_song)
      }
      counter += 1
    }
  }

  return result
}

export function tableRowPrimaryEntry(row: SetlistTableRowItem): SetlistEntry {
  return row.type === "single" ? row.entry : row.entries[0]!
}

export function tableRowEntrySet(row: SetlistTableRowItem): string {
  return tableRowPrimaryEntry(row).entry_set
}

export function tableRowEntryIds(row: SetlistTableRowItem): string[] {
  return row.type === "single" ?
      [row.entry.entry_id]
    : row.entries.map((e) => e.entry_id)
}

export function mergePairGuests(
  entries: SetlistEntry[],
): SetlistEntry["guests"] {
  const seen = new Set<string>()
  const merged: SetlistEntry["guests"] = []
  for (const entry of entries) {
    for (const guest of entry.guests ?? []) {
      if (seen.has(guest.guest_id)) continue
      seen.add(guest.guest_id)
      merged.push(guest)
    }
  }
  return merged
}

export function buildPairCoachNotesExpandedHtml(entries: SetlistEntry[]): string {
  return pairEntriesWithCoachNotes(entries)
    .map((e) => {
      const label = e.songs?.song_displayname?.trim() || e.entry_song
      const notes = e.entry_coachnotes!.trim()
      return `<div class="setlist-pair-coach-block"><span class="setlist-pair-coach-song-label">${escapeHtml(label)}</span><span class="setlist-pair-coach-notes"> ${notes}</span></div>`
    })
    .join("")
}

/** One-line collapsed preview: inline pills, HTML notes, semicolon between songs. */
export function buildPairCoachNotesCollapsedHtml(
  entries: SetlistEntry[],
): string {
  const withNotes = pairEntriesWithCoachNotes(entries)
  if (withNotes.length === 0) return ""

  if (withNotes.length > 1 && pairCoachNotesAllSame(withNotes)) {
    return withNotes[0]!.entry_coachnotes!.trim()
  }

  const segments = withNotes.map((e, index) => {
    const label = e.songs?.song_displayname?.trim() || e.entry_song
    const notes = e.entry_coachnotes!.trim()
    const suffix =
      withNotes.length > 1 && index < withNotes.length - 1 ?
        ";&nbsp;&nbsp;"
      : ""
    return `<span class="setlist-pair-coach-inline"><span class="setlist-pair-coach-song-label">${escapeHtml(label)}</span><span class="setlist-pair-coach-notes-inline"> ${notes}</span>${suffix}</span>`
  })

  return `<span class="setlist-pair-coach-collapsed">${segments.join("")}</span>`
}

function pairCoachNotesAllSame(entries: SetlistEntry[]): boolean {
  if (entries.length <= 1) return true
  const first = entries[0]!.entry_coachnotes!.trim()
  return entries.every((entry) => entry.entry_coachnotes!.trim() === first)
}

function pairEntriesWithCoachNotes(entries: SetlistEntry[]): SetlistEntry[] {
  return uniqueSongEntriesForPairModal(entries).filter((e) =>
    e.entry_coachnotes?.trim(),
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function pairCombinedLength(entries: SetlistEntry[]): string {
  return totalSetlistLength(entries)
}

export function pairHasWted(entries: SetlistEntry[]): boolean {
  return entries.some((e) => !!e.radio_id?.trim())
}

function pairSharedScalar<T>(
  entries: SetlistEntry[],
  getValue: (entry: SetlistEntry) => T,
  isEmpty: (value: T) => boolean = (value) =>
    value == null || value === "",
): T | null {
  if (entries.length === 0) return null

  const nonEmpty = entries
    .map(getValue)
    .filter((value) => !isEmpty(value))
  if (nonEmpty.length === 0) return null

  const shared = nonEmpty[0]!
  if (!nonEmpty.every((value) => value === shared)) return null
  return shared
}

/** When entries share the same Last badge text (ignoring blanks), return it for collapsed pair rows. */
export function pairSharedLastCount(entries: SetlistEntry[]): string | null {
  return pairSharedScalar(entries, (entry) => entry.last_count ?? "")
}

/** When entries share the same Tour count (ignoring blanks), return it for collapsed pair rows. */
export function pairSharedTourCount(entries: SetlistEntry[]): string | null {
  return pairSharedScalar(entries, (entry) => entry.song_tour_count ?? "")
}

/** Combined rarity for collapsed pair rows: Σ times_played_num ÷ Σ shows_since_debut_num. */
export function pairCombinedRarity(entries: SetlistEntry[]): string {
  let timesPlayedTotal = 0
  let showsSinceDebutTotal = 0
  for (const entry of entries) {
    if (entry.times_played_num != null) {
      timesPlayedTotal += entry.times_played_num
    }
    if (entry.shows_since_debut_num != null) {
      showsSinceDebutTotal += entry.shows_since_debut_num
    }
  }
  return calculateRarity(timesPlayedTotal, showsSinceDebutTotal)
}

/** Ordered non-`none` placement tokens for pair rows (consecutive duplicates collapsed). */
export function pairPlacementBarTokens(
  entries: SetlistEntry[],
): PlacementBarCssToken[] {
  const tokens: PlacementBarCssToken[] = []
  let prev: PlacementBarCssToken | null = null
  for (const entry of entries) {
    const token = getPlacementBarCssToken(entry.entry_placement ?? null)
    if (token === "none") continue
    if (token === prev) continue
    tokens.push(token)
    prev = token
  }
  return tokens
}

/** First placement bar color token from any entry in the pair (legacy single-bar). */
export function pairPlacementBarToken(
  entries: SetlistEntry[],
): PlacementBarCssToken {
  return pairPlacementBarTokens(entries)[0] ?? "none"
}

/** One representative entry per unique non-empty `radio_id`. */
export function uniqueWtedEntriesFromPair(
  entries: SetlistEntry[],
): SetlistEntry[] {
  const byRadioId = new Map<string, SetlistEntry>()
  for (const entry of entries) {
    const rid = entry.radio_id?.trim()
    if (!rid) continue
    if (!byRadioId.has(rid)) byRadioId.set(rid, entry)
  }
  return [...byRadioId.values()]
}

/** First entry per unique song in setlist order (for pair modals with repeated songs). */
export function uniqueSongEntriesForPairModal(
  entries: SetlistEntry[],
): SetlistEntry[] {
  const seen = new Set<string>()
  const unique: SetlistEntry[] = []
  for (const entry of entries) {
    const key = entry.song_id?.trim() || entry.entry_song
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(entry)
  }
  return unique
}
