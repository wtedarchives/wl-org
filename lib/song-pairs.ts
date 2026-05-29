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

const REPRISE_COMBINE_ENTRY_SONGS = new Set([
  "teaprise",
  "[trevor reads poetry]",
])

function isImprovJamEntry(entry: SetlistEntry): boolean {
  return entry.entry_song?.trim() === INDEX_SKIP_SONG_IMPROV_JAM
}

/** True when `entry_segue` is `>` or segues into the next song (`> …`). */
function hasSegueIntoNext(entry: SetlistEntry): boolean {
  const segue = entry.entry_segue?.trim()
  if (!segue) return false
  return segue.startsWith(">")
}

function isConsecutiveInSameSet(
  earlier: SetlistEntry,
  later: SetlistEntry,
): boolean {
  return (
    earlier.entry_set === later.entry_set &&
    later.entry_setnum === earlier.entry_setnum + 1
  )
}

function indexCoveredByEntryRanges(
  index: number,
  ranges: Map<number, SetlistEntry[]>,
): boolean {
  for (const [start, entries] of ranges) {
    if (index >= start && index < start + entries.length) return true
  }
  return false
}

function indexCoveredByPairRanges(
  index: number,
  pairRanges: Map<number, { pair: SongPair; entries: SetlistEntry[] }>,
): boolean {
  for (const [start, range] of pairRanges) {
    if (index >= start && index < start + range.entries.length) return true
  }
  return false
}

function isRepriseEntry(entry: SetlistEntry): boolean {
  if (isImprovJamEntry(entry)) return false
  if (entry.entry_short?.trim().toLowerCase() === "reprise") return true
  const song = entry.entry_song?.trim().toLowerCase()
  return song != null && REPRISE_COMBINE_ENTRY_SONGS.has(song)
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

function appendTrailingRepriseEntries(
  setlist: SetlistEntry[],
  startIndex: number,
  entries: SetlistEntry[],
): SetlistEntry[] {
  if (entries.length === 0) return entries
  const trailing: SetlistEntry[] = []
  let last = entries[entries.length - 1]!
  let j = startIndex
  while (j < setlist.length) {
    const next = setlist[j]!
    if (!isRepriseEntry(next)) break
    if (!isConsecutiveInSameSet(last, next)) break
    trailing.push(next)
    last = next
    j++
  }
  return trailing.length > 0 ? [...entries, ...trailing] : entries
}

/** Extend DB song-pair rows with consecutive reprise entries immediately following the pair. */
function extendPairRangesWithTrailingReprises(
  setlist: SetlistEntry[],
  pairRanges: Map<number, { pair: SongPair; entries: SetlistEntry[] }>,
): Map<number, { pair: SongPair; entries: SetlistEntry[] }> {
  const extended = new Map<number, { pair: SongPair; entries: SetlistEntry[] }>()
  for (const [start, range] of pairRanges) {
    extended.set(start, {
      pair: range.pair,
      entries: appendTrailingRepriseEntries(
        setlist,
        start + range.entries.length,
        range.entries,
      ),
    })
  }
  return extended
}

/** Trailing reprise / Teaprise rows adjoined after a pair block (for alt_name display). */
export function splitPairRowTrailingRepriseEntries(entries: SetlistEntry[]): {
  coreEntries: SetlistEntry[]
  trailingRepriseEntries: SetlistEntry[]
} {
  let splitAt = entries.length
  while (splitAt > 0 && isRepriseEntry(entries[splitAt - 1]!)) {
    splitAt--
  }
  return {
    coreEntries: entries.slice(0, splitAt),
    trailingRepriseEntries: entries.slice(splitAt),
  }
}

export type AltNameSegment =
  | { type: "text"; value: string }
  | { type: "paren"; value: string }

/** Split alt_name into plain text and parenthetical segments for pill rendering. */
export function parseAltNameSegments(altName: string): AltNameSegment[] {
  const segments: AltNameSegment[] = []
  const re = /\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(altName)) !== null) {
    if (match.index > lastIndex) {
      const text = altName.slice(lastIndex, match.index).replace(/\s+$/, "")
      if (text) segments.push({ type: "text", value: text })
    }
    const inner = match[1]?.trim()
    if (inner) segments.push({ type: "paren", value: inner })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < altName.length) {
    const text = altName.slice(lastIndex).replace(/^\s+/, "")
    if (text) segments.push({ type: "text", value: text })
  }

  return segments
}

export function altNameHasParentheticalSegments(altName: string): boolean {
  return parseAltNameSegments(altName).some((segment) => segment.type === "paren")
}

/**
 * Preceding non-reprise entry plus one or more consecutive reprise rows (`entry_short`
 * reprise, or `entry_song` Teaprise / [Trevor Reads Poetry]) in the same set with
 * sequential `entry_setnum` values. Skips indices already covered by a song-pair match.
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

    if (indexCoveredByPairRanges(i, pairRanges)) {
      i++
      continue
    }

    const prevIndex = i - 1
    if (indexCoveredByPairRanges(prevIndex, pairRanges)) {
      i++
      continue
    }

    const prevEntry = setlist[prevIndex]!
    if (isRepriseEntry(prevEntry)) {
      i++
      continue
    }
    if (!isConsecutiveInSameSet(prevEntry, repriseEntry)) {
      i++
      continue
    }

    const entries: SetlistEntry[] = [prevEntry, repriseEntry]
    let j = i + 1
    while (j < setlist.length) {
      const next = setlist[j]!
      const last = entries[entries.length - 1]!
      if (!isRepriseEntry(next)) break
      if (!isConsecutiveInSameSet(last, next)) break
      entries.push(next)
      j++
    }

    ranges.set(prevIndex, entries)
    i = j
  }
  return ranges
}

function findImprovJamRuns(
  setlist: SetlistEntry[],
): { start: number; end: number }[] {
  const runs: { start: number; end: number }[] = []
  let i = 0
  while (i < setlist.length) {
    if (!isImprovJamEntry(setlist[i]!)) {
      i++
      continue
    }
    const runStart = i
    const setId = setlist[i]!.entry_set
    i++
    while (i < setlist.length) {
      const entry = setlist[i]!
      if (!isImprovJamEntry(entry)) break
      if (entry.entry_set !== setId) break
      if (!isConsecutiveInSameSet(setlist[i - 1]!, entry)) break
      i++
    }
    runs.push({ start: runStart, end: i - 1 })
  }
  return runs
}

type ImprovJamCombineGroup = { startIndex: number; entries: SetlistEntry[] }

/** Left chain: anchor with `>` pulls consecutive Improvs while each prior link has `>`. */
function buildImprovJamLeftChain(
  anchor: SetlistEntry,
  improvs: SetlistEntry[],
): SetlistEntry[] {
  if (!hasSegueIntoNext(anchor)) return []
  const chain: SetlistEntry[] = [anchor]
  for (const improv of improvs) {
    const prev = chain[chain.length - 1]!
    if (!hasSegueIntoNext(prev) || !isConsecutiveInSameSet(prev, improv)) break
    chain.push(improv)
  }
  return chain.length >= 2 ? chain : []
}

/** Right chain: first remaining Improv with `>` pulls improvs then optional next song. */
function buildImprovJamRightChain(
  remainingImprovs: SetlistEntry[],
  after: SetlistEntry | null,
  suppressForwardToAfter: boolean,
): SetlistEntry[] {
  if (remainingImprovs.length === 0 || !hasSegueIntoNext(remainingImprovs[0]!)) {
    return []
  }

  const chain: SetlistEntry[] = [remainingImprovs[0]!]
  for (let k = 1; k < remainingImprovs.length; k++) {
    const prev = chain[chain.length - 1]!
    const improv = remainingImprovs[k]!
    if (!hasSegueIntoNext(prev) || !isConsecutiveInSameSet(prev, improv)) break
    chain.push(improv)
  }

  const last = chain[chain.length - 1]!
  if (
    !suppressForwardToAfter &&
    after &&
    hasSegueIntoNext(last) &&
    isConsecutiveInSameSet(last, after)
  ) {
    chain.push(after)
  }

  return chain.length >= 2 ? chain : []
}

function findImprovJamGroupsForRun(
  setlist: SetlistEntry[],
  runStart: number,
  runEnd: number,
  isBlocked: (index: number) => boolean,
): ImprovJamCombineGroup[] {
  const improvs = setlist.slice(runStart, runEnd + 1)
  const anchorIndex = runStart - 1
  const anchor =
    anchorIndex >= 0 &&
    !isBlocked(anchorIndex) &&
    !isImprovJamEntry(setlist[anchorIndex]!) &&
    isConsecutiveInSameSet(setlist[anchorIndex]!, improvs[0]!)
      ? setlist[anchorIndex]!
      : null

  const afterIndex = runEnd + 1
  const after =
    afterIndex < setlist.length &&
    !isBlocked(afterIndex) &&
    !isImprovJamEntry(setlist[afterIndex]!) &&
    isConsecutiveInSameSet(setlist[runEnd]!, setlist[afterIndex]!)
      ? setlist[afterIndex]!
      : null

  const leftChain = anchor ? buildImprovJamLeftChain(anchor, improvs) : []
  const improvsInLeft = leftChain.length > 0 ? leftChain.length - 1 : 0
  const remainingImprovs = improvs.slice(improvsInLeft)

  const leftAbsorbedAllImprovs = improvsInLeft === improvs.length
  const suppressForwardToAfter =
    leftAbsorbedAllImprovs &&
    leftChain.length > 0 &&
    leftChain.every(hasSegueIntoNext) &&
    after != null

  const groups: ImprovJamCombineGroup[] = []

  if (leftChain.length >= 2) {
    groups.push({ startIndex: anchorIndex, entries: leftChain })
  }

  const rightChain = buildImprovJamRightChain(
    remainingImprovs,
    after,
    suppressForwardToAfter,
  )
  if (rightChain.length >= 2) {
    groups.push({
      startIndex: runStart + improvsInLeft,
      entries: rightChain,
    })
  }

  return groups
}

/**
 * `[Improv/Jam]` combines via `entry_segue` `>` chains in the same set:
 * - Left: prior song with `>` pulls consecutive Improvs while each link has `>`.
 * - Right: first unmatched Improv with `>` pulls later Improvs and optionally the
 *   next non-Improv song — unless the left chain absorbed every Improv and every
 *   entry in that left chain has `>` (then the following song stays separate).
 */
export function findImprovJamCombineRanges(
  setlist: SetlistEntry[],
  pairRanges: Map<number, { pair: SongPair; entries: SetlistEntry[] }>,
  repriseRanges: Map<number, SetlistEntry[]>,
): Map<number, SetlistEntry[]> {
  const ranges = new Map<number, SetlistEntry[]>()
  const isBlocked = (index: number) =>
    indexCoveredByPairRanges(index, pairRanges) ||
    indexCoveredByEntryRanges(index, repriseRanges) ||
    indexCoveredByEntryRanges(index, ranges)

  for (const { start, end } of findImprovJamRuns(setlist)) {
    let runBlocked = false
    for (let idx = start; idx <= end; idx++) {
      if (isBlocked(idx)) {
        runBlocked = true
        break
      }
    }
    if (runBlocked) continue

    for (const group of findImprovJamGroupsForRun(
      setlist,
      start,
      end,
      isBlocked,
    )) {
      ranges.set(group.startIndex, group.entries)
    }
  }

  return ranges
}

function mergeEntryRanges(
  ...rangeMaps: Map<number, SetlistEntry[]>[]
): Map<number, SetlistEntry[]> {
  const merged = new Map<number, SetlistEntry[]>()
  for (const map of rangeMaps) {
    for (const [start, entries] of map) {
      merged.set(start, entries)
    }
  }
  return merged
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
  const basePairRanges =
    songPairs.length > 0 ?
      findSetlistSongPairRanges(setlist, songPairs)
    : new Map<number, { pair: SongPair; entries: SetlistEntry[] }>()
  const pairRanges = extendPairRangesWithTrailingReprises(setlist, basePairRanges)
  const baseRepriseRanges = findRepriseCombineRanges(setlist, pairRanges)
  const repriseRanges = mergeEntryRanges(
    baseRepriseRanges,
    findImprovJamCombineRanges(setlist, pairRanges, baseRepriseRanges),
  )

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
