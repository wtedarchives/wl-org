import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShowSlice {
  show_id: string
  show_iscanon?: boolean
  show_canonid?: number | null
}

interface SetlistEntry {
  entry_song: string
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string
  entry_setorder: number
  entry_set: string
  entry_setnum: number
  averageLength: string | null
  songs: {
    song_id: string
    song_displayname?: string | null
    category_artwork?: string | null
  }
}

interface SongSelectionDetail {
  song: string
  assignedSet: string
  totalAppearances: number
  normalizedAverageScore: number
  stdDeviation: number
  rarityPercentage: number
  wasTrimmingCandidate: boolean
  cutReason: string | null
}

interface SetlistStats {
  totalCanonicalShows: number
  /** Canonical shows in the slice that have ≥1 qualifying setlist entry (same filters as validEntries). */
  showsWithSetlistData: number
  totalSetlistEntries: number
  includedSets: Array<{
    set: string
    showsWithSet: number
    percentage: number
    avgSongsPerSet: number
  }>
  totalUniqueSongs: number
  threshold: number
  songSelections: SongSelectionDetail[]
  trimRequired: boolean
  cutoffFrequency: number
  maxAppearancesInPool: number
  maxSongsInSlice: number
}

export interface AverageSetlistResult {
  averageSetlist: SetlistEntry[]
  stats: SetlistStats | null
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SET_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "E1", "E2", "E3"]
const SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"]
const SET_INCLUSION_THRESHOLD = 0.5
const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDuration(interval: string | null | undefined): number | null {
  if (!interval) return null
  const match = interval.match(/^(?:(\d+):)?(\d+):(\d+)$/)
  if (!match) return null
  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2], 10)
  const seconds = parseInt(match[3], 10)
  return hours * 3600 + minutes * 60 + seconds
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function calcStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAverageSetlist(
  shows: ShowSlice[],
  _type: "year" | "tour",
): AverageSetlistResult {
  const [averageSetlist, setAverageSetlist] = useState<SetlistEntry[]>([])
  const [stats, setStats] = useState<SetlistStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const showsRef = useRef(shows)
  showsRef.current = shows

  const showsKey = useMemo(() => {
    if (!shows || shows.length === 0) return ""
    return shows
      .filter((s) => s.show_iscanon === true || s.show_canonid !== null)
      .map((s) => s.show_id)
      .sort()
      .join("|")
  }, [shows])

  useEffect(() => {
    async function calculateAverageSetlist() {
      const currentShows = showsRef.current

      if (!currentShows || currentShows.length === 0 || !supabase) {
        setAverageSetlist([])
        setStats(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // ─────────────────────────────────────────────────────────────────
        // STEP 1 — Filter to canonical shows only
        // ─────────────────────────────────────────────────────────────────
        const canonicalShows = currentShows.filter(
          (s) => s.show_iscanon === true || s.show_canonid !== null,
        )


        if (canonicalShows.length === 0) {
          setAverageSetlist([])
          setStats(null)
          setIsLoading(false)
          return
        }

        const showIds = canonicalShows.map((s) => s.show_id)

        // Build showId → canonId map from canonical shows (no extra fetch needed)
        const showIdToCanonId = new Map<string, number>()
        for (const show of canonicalShows) {
          if (show.show_canonid != null) {
            showIdToCanonId.set(show.show_id, show.show_canonid)
          }
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 2 — Fetch all setlist entries for these shows
        //
        // entry_setorder is the song's absolute position in the full show
        // (e.g. 13th song played = 13). Used for normalized position scoring.
        //
        // times_played_num and shows_since_debut_num are used to compute
        // rarity from the most recent canonical entry per song.
        // ─────────────────────────────────────────────────────────────────

        const showIdChunks: string[][] = []
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
        }

        let allEntries: any[] = []

        for (const chunk of showIdChunks) {
          let page = 0
          let hasMore = true
          while (hasMore) {
            const { data, error: fetchError } = await supabase
              .from("setlist_entries")
              .select(`
                entry_song,
                entry_short,
                entry_segue,
                entry_placement,
                entry_set,
                entry_setnum,
                entry_setorder,
                entry_show,
                entry_length,
                times_played_num,
                shows_since_debut_num,
                songs (
                  song_id,
                  song_displayname,
                  categories (
                    category_artwork
                  )
                )
              `)
              .in("entry_show", chunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (fetchError) throw fetchError

            if (data && data.length > 0) {
              allEntries = allEntries.concat(data as any[])
              page++
              hasMore = data.length === PAGE_SIZE
            } else {
              hasMore = false
            }
          }
        }

        const validEntries = allEntries.filter(
          (e) => !e.entry_short || !SKIP_SHORTS.includes(e.entry_short.toLowerCase()),
        )


        if (validEntries.length === 0) {
          setAverageSetlist([])
          setStats({
            totalCanonicalShows: canonicalShows.length,
            showsWithSetlistData: 0,
            totalSetlistEntries: 0,
            includedSets: [],
            totalUniqueSongs: 0,
            threshold: SET_INCLUSION_THRESHOLD * 100,
            songSelections: [],
            trimRequired: false,
            cutoffFrequency: 0,
            maxAppearancesInPool: 0,
            maxSongsInSlice: 0,
          })
          setIsLoading(false)
          return
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 3 — Build all lookup maps in a single pass over valid entries
        //
        // Maps built here:
        //   showSetSongs:        showId → set → Set<songName>
        //     (set inclusion check and avg songs per set calculation)
        //   showAllSongs:        showId → Set<songName>
        //     (total distinct valid songs per show — denominator for normalization)
        //   songShowAppearances: songName → showId → { setorder, set, setnum, lengthSeconds }[]
        //     (scoring, std dev, and average length calculation)
        //   songRaritySource:    songName → { timesPlayed, showsSinceDebut, canonId }
        //     (tracks the entry from the highest canonId show per song for rarity)
        //
        // Derived after the loop:
        //   maxSongsInSlice = max value across showAllSongs sizes
        //     (the common scale for normalized position scoring)
        //   songRarity = songName → (timesPlayed / showsSinceDebut) * 100
        // ─────────────────────────────────────────────────────────────────

        const showSetSongs = new Map<string, Map<string, Set<string>>>()
        const showAllSongs = new Map<string, Set<string>>()
        const songShowAppearances = new Map<string, Map<string, Array<{
          setorder: number
          set: string
          setnum: number
          lengthSeconds: number | null
        }>>>()
        const songRaritySource = new Map<string, {
          timesPlayed: number
          showsSinceDebut: number
          canonId: number
        }>()

        for (const entry of validEntries) {
          const showId = entry.entry_show as string
          const set = entry.entry_set as string
          const song = entry.entry_song as string
          const setnum = entry.entry_setnum as number
          const setorder = entry.entry_setorder as number
          const lengthSeconds = parseDuration(entry.entry_length)
          const canonId = showIdToCanonId.get(showId)

          // showSetSongs
          if (!showSetSongs.has(showId)) showSetSongs.set(showId, new Map())
          const setsForShow = showSetSongs.get(showId)!
          if (!setsForShow.has(set)) setsForShow.set(set, new Set())
          setsForShow.get(set)!.add(song)

          // showAllSongs
          if (!showAllSongs.has(showId)) showAllSongs.set(showId, new Set())
          showAllSongs.get(showId)!.add(song)

          // songShowAppearances
          if (!songShowAppearances.has(song)) songShowAppearances.set(song, new Map())
          const showsForSong = songShowAppearances.get(song)!
          if (!showsForSong.has(showId)) showsForSong.set(showId, [])
          showsForSong.get(showId)!.push({ setorder, set, setnum, lengthSeconds })

          // songRaritySource — keep record from the highest canonId show
          if (canonId != null) {
            const timesPlayed = entry.times_played_num as number | null
            const showsSinceDebut = entry.shows_since_debut_num as number | null
            if (timesPlayed != null && showsSinceDebut != null && showsSinceDebut > 0) {
              const existing = songRaritySource.get(song)
              if (!existing || canonId > existing.canonId) {
                songRaritySource.set(song, { timesPlayed, showsSinceDebut, canonId })
              }
            }
          }
        }

        // Max distinct valid songs in any single show — normalization scale
        let maxSongsInSlice = 0
        for (const [, songsSet] of showAllSongs) {
          if (songsSet.size > maxSongsInSlice) maxSongsInSlice = songsSet.size
        }

        // Rarity percentage per song
        const songRarity = new Map<string, number>()
        for (const [song, { timesPlayed, showsSinceDebut }] of songRaritySource) {
          songRarity.set(song, (timesPlayed / showsSinceDebut) * 100)
        }


        // ─────────────────────────────────────────────────────────────────
        // STEP 4 — Determine which sets are included in the model
        //
        // A set is included if it appears in more than 50% of canonical
        // shows that have qualifying setlist data in this slice (not the
        // full canonical count). Denominator = showSetSongs.size.
        // ─────────────────────────────────────────────────────────────────

        const showsWithSetlistDataCount = showSetSongs.size

        const includedSets: string[] = []
        const includedSetsStats: SetlistStats["includedSets"] = []

        for (const set of SET_ORDER) {
          let showsWithSet = 0
          for (const [, setsForShow] of showSetSongs) {
            if (setsForShow.has(set)) showsWithSet++
          }

          if (showsWithSet === 0) {
            continue
          }

          const percentage = showsWithSet / showsWithSetlistDataCount

          if (percentage <= SET_INCLUSION_THRESHOLD) {
            continue
          }

          let totalDistinctSongs = 0
          let showsCountedForAvg = 0
          for (const [, setsForShow] of showSetSongs) {
            if (setsForShow.has(set)) {
              totalDistinctSongs += setsForShow.get(set)!.size
              showsCountedForAvg++
            }
          }
          const avgSongsPerSet = Math.round(totalDistinctSongs / showsCountedForAvg)

          includedSets.push(set)
          includedSetsStats.push({ set, showsWithSet, percentage: percentage * 100, avgSongsPerSet })

        }

        const totalSongsNeeded = includedSetsStats.reduce((sum, s) => sum + s.avgSongsPerSet, 0)

        if (includedSets.length === 0) {
          setAverageSetlist([])
          setStats({
            totalCanonicalShows: canonicalShows.length,
            showsWithSetlistData: showsWithSetlistDataCount,
            totalSetlistEntries: validEntries.length,
            includedSets: [],
            totalUniqueSongs: 0,
            threshold: SET_INCLUSION_THRESHOLD * 100,
            songSelections: [],
            trimRequired: false,
            cutoffFrequency: 0,
            maxAppearancesInPool: 0,
            maxSongsInSlice,
          })
          setIsLoading(false)
          return
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 5 — Build the tie-expanded song pool
        //
        // 1. Count distinct show appearances per song.
        // 2. Sort descending by appearance count.
        // 3. Find the cutoff frequency: the appearance count of the song
        //    sitting at position N (the last needed slot).
        // 4. Expand pool to ALL songs at or above that frequency so no
        //    song is arbitrarily excluded when multiple songs are tied
        //    at the boundary.
        // ─────────────────────────────────────────────────────────────────

        const songAppearanceCounts: Array<{ song: string; count: number }> = []
        for (const [song, showsMap] of songShowAppearances) {
          songAppearanceCounts.push({ song, count: showsMap.size })
        }

        songAppearanceCounts.sort((a, b) => b.count - a.count)


        const cutoffEntry = songAppearanceCounts[totalSongsNeeded - 1]
        const cutoffFrequency = cutoffEntry?.count ?? 1


        const pool = songAppearanceCounts.filter((s) => s.count >= cutoffFrequency)
        const maxAppearancesInPool = pool[0]?.count ?? 0
        const trimRequired = pool.length > totalSongsNeeded

        // ─────────────────────────────────────────────────────────────────
        // STEP 6 — Score every song in the pool
        //
        // Normalized position formula per appearance:
        //   normalizedScore = (entry_setorder / totalSongsInShow) * maxSongsInSlice
        //
        // This scales every song's position onto a common range regardless
        // of how long that particular show was. A song played 2nd out of 14
        // in a show where the longest show has 16 songs scores:
        //   (2 / 14) * 16 = 2.286
        //
        // If a song appears more than once in a show, those normalized
        // scores are averaged for that show first. Then per-show averages
        // are averaged across all shows to produce the final score.
        //
        // Std dev is computed from the per-show average scores. It measures
        // how consistently the song appears in the same relative spot night
        // to night — used as a tiebreaker for trimming in Step 7.
        // ─────────────────────────────────────────────────────────────────

        interface ScoredSong {
          song: string
          appearances: number
          normalizedAverageScore: number
          stdDeviation: number
          rarityPercentage: number
          averageLength: string | null
        }

        const scoredPool: ScoredSong[] = []

        for (const { song, count } of pool) {
          const showsMap = songShowAppearances.get(song)!
          const showAverageScores: number[] = []
          let totalLengthSeconds = 0
          let lengthShowCount = 0

          for (const [showId, appearances] of showsMap) {
            const totalSongsInShow = showAllSongs.get(showId)?.size ?? appearances.length

            const normalizedScores = appearances.map(({ setorder }) =>
              (setorder / totalSongsInShow) * maxSongsInSlice,
            )

            // Average if played multiple times in one show
            const showAvg = normalizedScores.reduce((s, v) => s + v, 0) / normalizedScores.length
            showAverageScores.push(showAvg)

            const showLength = appearances.reduce((s, { lengthSeconds }) => s + (lengthSeconds ?? 0), 0)
            if (showLength > 0) {
              totalLengthSeconds += showLength
              lengthShowCount++
            }

          }

          const normalizedAverageScore =
            showAverageScores.reduce((s, v) => s + v, 0) / showAverageScores.length

          const deviation = calcStdDev(showAverageScores)

          const averageLength =
            lengthShowCount > 0
              ? formatDuration(Math.round(totalLengthSeconds / lengthShowCount))
              : null

          const rarityPct = songRarity.get(song) ?? 0

          scoredPool.push({
            song,
            appearances: count,
            normalizedAverageScore,
            stdDeviation: deviation,
            rarityPercentage: rarityPct,
            averageLength,
          })

        }


        // ─────────────────────────────────────────────────────────────────
        // STEP 7 — Trim pool to exactly totalSongsNeeded (if required)
        //
        // Only runs when the tie expansion pushed the pool above the needed
        // count. Skipped entirely if the pool is already the right size.
        //
        // Only songs at the cutoff frequency tier are eligible for cutting.
        // Songs with more appearances are completely immune.
        //
        // Cut priority within the cutoff tier:
        //   1. Highest std dev first (most positionally erratic)
        //   2. Tied std dev → lowest rarity percentage first
        //      (less historically common = weaker claim to a slot)
        //   3. Tied rarity → alphabetical (deterministic last resort)
        // ─────────────────────────────────────────────────────────────────

        let finalPool: ScoredSong[]
        const cutLog: Array<{ song: string; reason: string }> = []

        if (!trimRequired) {
          finalPool = [...scoredPool]
        } else {
          const songsToCut = pool.length - totalSongsNeeded

          const immuneSongs = scoredPool.filter((s) => s.appearances > cutoffFrequency)
          const trimCandidates = scoredPool.filter((s) => s.appearances === cutoffFrequency)


          // Sort by cut priority: highest std dev → lowest rarity → alphabetical
          trimCandidates.sort((a, b) => {
            if (b.stdDeviation !== a.stdDeviation) return b.stdDeviation - a.stdDeviation
            if (a.rarityPercentage !== b.rarityPercentage) return a.rarityPercentage - b.rarityPercentage
            return a.song.localeCompare(b.song)
          })


          const cutSongs = new Set(trimCandidates.slice(0, songsToCut).map((s) => s.song))

          for (const s of trimCandidates.slice(0, songsToCut)) {
            const sameStdDevSongs = trimCandidates.filter(
              (c) => Math.abs(c.stdDeviation - s.stdDeviation) < 0.0001 && c.song !== s.song
            )
            let reason = `Cutoff tier (${cutoffFrequency} appearance(s)) | std dev: ${s.stdDeviation.toFixed(3)}`
            if (sameStdDevSongs.length > 0) {
              reason += ` | std dev tied — cut by lower rarity: ${s.rarityPercentage.toFixed(2)}%`
            }
            cutLog.push({ song: s.song, reason })
          }

          const survivingCandidates = trimCandidates.filter((s) => !cutSongs.has(s.song))
          finalPool = [...immuneSongs, ...survivingCandidates]

        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 8 — Sort final pool by normalized average score ascending
        //
        // Lower score = appeared earlier in shows on average.
        // This preserves the natural shape of a real show — openers sort
        // to the top, closers and encore songs sort to the bottom.
        // ─────────────────────────────────────────────────────────────────

        finalPool.sort((a, b) => a.normalizedAverageScore - b.normalizedAverageScore)


        // ─────────────────────────────────────────────────────────────────
        // STEP 9 — Slice sorted pool into sets and build result entries
        //
        // The sorted pool is sliced into consecutive chunks matching each
        // included set's avg song count. Because the pool is already sorted
        // by normalized position, the first chunk naturally contains the
        // earliest-playing songs (Set 1), the next the second-earliest
        // (Set 2), and so on through encores.
        //
        // Within each main set chunk:
        //   position 1 → "Set X Opener"
        //   last position → "Set X Closer"
        //   (encores don't use opener/closer labels)
        // ─────────────────────────────────────────────────────────────────

        const resultEntries: SetlistEntry[] = []
        const songSelections: SongSelectionDetail[] = []
        let poolIndex = 0

        for (const setStat of includedSetsStats) {
          const { set, avgSongsPerSet } = setStat
          const isEncore = set.startsWith("E")

          const setLabel =
            set === "1" ? "Set 1"
            : set === "2" ? "Set 2"
            : set === "3" ? "Set 3"
            : set === "4" ? "Set 4"
            : set === "5" ? "Set 5"
            : set === "6" ? "Set 6"
            : set === "7" ? "Set 7"
            : set === "8" ? "Set 8"
            : set === "E1" ? "Encore 1"
            : set === "E2" ? "Encore 2"
            : set === "E3" ? "Encore 3"
            : set

          const songsForThisSet = finalPool.slice(poolIndex, poolIndex + avgSongsPerSet)


          songsForThisSet.forEach((songData, index) => {
            const positionInSet = index + 1

            let finalPlacement = setLabel
            if (!isEncore) {
              if (index === 0) finalPlacement = `${setLabel} Opener`
              else if (index === songsForThisSet.length - 1) finalPlacement = `${setLabel} Closer`
            }

            const sampleEntry = validEntries.find(
              (e) => e.entry_song === songData.song && e.songs?.song_id,
            )
            if (!sampleEntry) {
              console.error(`  WARNING: No sample entry found for "${songData.song}" — skipping (missing song metadata)`)
              return
            }

            const songsRel = sampleEntry.songs
            const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel

            resultEntries.push({
              entry_song: songData.song,
              entry_short: null,
              entry_segue: null,
              entry_placement: finalPlacement,
              entry_setorder: positionInSet,
              entry_set: set,
              entry_setnum: positionInSet,
              averageLength: songData.averageLength,
              songs: {
                song_id: songRow?.song_id ?? "",
                song_displayname: songRow?.song_displayname ?? null,
                category_artwork: songRow?.categories?.category_artwork ?? null,
              },
            })

            const cutEntry = cutLog.find((c) => c.song === songData.song)
            songSelections.push({
              song: songData.song,
              assignedSet: set,
              totalAppearances: songData.appearances,
              normalizedAverageScore: songData.normalizedAverageScore,
              stdDeviation: songData.stdDeviation,
              rarityPercentage: songData.rarityPercentage,
              wasTrimmingCandidate: songData.appearances === cutoffFrequency && trimRequired,
              cutReason: cutEntry?.reason ?? null,
            })
          })

          poolIndex += avgSongsPerSet
        }


        // ─────────────────────────────────────────────────────────────────
        // STEP 10 — Final sort for display
        //
        // Sort by global SET_ORDER then by position within set so the UI
        // always reads Set 1 → Set 2 → … → Encore in the correct order.
        // ─────────────────────────────────────────────────────────────────
        resultEntries.sort((a, b) => {
          const setA = SET_ORDER.indexOf(a.entry_set)
          const setB = SET_ORDER.indexOf(b.entry_set)
          if (setA !== setB) return setA - setB
          return a.entry_setnum - b.entry_setnum
        })


        setAverageSetlist(resultEntries)
        setStats({
          totalCanonicalShows: canonicalShows.length,
          showsWithSetlistData: showsWithSetlistDataCount,
          totalSetlistEntries: validEntries.length,
          includedSets: includedSetsStats,
          totalUniqueSongs: songShowAppearances.size,
          threshold: SET_INCLUSION_THRESHOLD * 100,
          songSelections,
          trimRequired,
          cutoffFrequency,
          maxAppearancesInPool,
          maxSongsInSlice,
        })
        setIsLoading(false)
      } catch (err) {
        console.error("AVERAGE SETLIST — ERROR:", err)
        setError(err instanceof Error ? err.message : "Failed to calculate average setlist")
        setAverageSetlist([])
        setStats(null)
        setIsLoading(false)
      }
    }

    calculateAverageSetlist()
  }, [showsKey])

  return { averageSetlist, stats, isLoading, error }
}