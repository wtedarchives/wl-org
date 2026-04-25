import type { SetlistEntry } from "@/types/setlist"
import { getPlacementBarColor } from "@/lib/placement-bar-color"

/** Rows with these entry_short values (case-insensitive) get no number in the # column. */
export const INDEX_SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"]

/** If `entry_song` matches exactly, `[entry_short]` is not shown in setlist UI. */
export const ENTRY_SHORT_HIDDEN_FOR_SONGS = [
  "Charge",
  "First Call",
  "Happy Birthday to You",
  "[Trevor Reads Poetry]",
] as const

const ENTRY_SHORT_HIDDEN_FOR_SONG_SET = new Set<string>(ENTRY_SHORT_HIDDEN_FOR_SONGS)

/**
 * Whether to render `[entry_short]` for this row (song cell, tooltips, scan drawer, WTED slots, JOTY sheet).
 */
export function shouldShowSetlistEntryShort(
  entrySong: string | null | undefined,
  entryShort: string | null | undefined,
): boolean {
  if (!entryShort) return false
  if (entrySong != null && ENTRY_SHORT_HIDDEN_FOR_SONG_SET.has(entrySong)) return false
  return true
}

/** entry_song value that never receives a # (placeholder jam row). */
export const INDEX_SKIP_SONG_IMPROV_JAM = "[Improv/Jam]"

/**
 * Compute display number for each setlist row: running count 1, 2, 3, …
 * Skip (null) when entry_short is in INDEX_SKIP_SHORTS, when entry_song is
 * INDEX_SKIP_SONG_IMPROV_JAM, or when we've already assigned a number to that
 * entry_song (first occurrence gets the number, duplicates get none).
 */
export function computeDisplayNumbers(setlist: SetlistEntry[]): (number | null)[] {
  const result: (number | null)[] = []
  let counter = 1
  const songsNumbered = new Set<string>()
  for (const entry of setlist) {
    const short = entry.entry_short?.toLowerCase()
    const skipByShort =
      short != null && INDEX_SKIP_SHORTS.some((s) => s === short)
    const skipByImprovJam = entry.entry_song === INDEX_SKIP_SONG_IMPROV_JAM
    const skipByDuplicate = songsNumbered.has(entry.entry_song)
    if (skipByShort || skipByImprovJam || skipByDuplicate) {
      result.push(null)
    } else {
      result.push(counter)
      songsNumbered.add(entry.entry_song)
      counter += 1
    }
  }
  return result
}

/** Last column badge style by last_count content (case-sensitive substring). */
export function getLastCountBadgeStyle(lastCount: string | null): {
  className: string
} | null {
  if (!lastCount) return null
  if (lastCount.includes("TD"))
    return { className: "rounded bg-emerald-800 px-1.5 py-0.5 text-[11px] font-medium text-white" }
  if (lastCount.includes("LIB"))
    return { className: "rounded bg-yellow-800 px-1.5 py-0.5 text-[11px] font-medium text-white" }
  if (lastCount.includes("Debut"))
    return { className: "rounded bg-rose-800 px-1.5 py-0.5 text-[11px] font-medium text-white" }
  return null
}

/**
 * Same TD / LIB / Debut match order as `getLastCountBadgeStyle`, for WL Home v2 setlist.
 * Same *shape* as the Song column `entry_short` pill. LIB reads honey/amber; Debut reads
 * dusty rose (distinct from each other and from the short pill’s straight coral).
 */
export function getLastCountPillStyle(lastCount: string | null): {
  background: string
  color: string
  borderColor: string
} | null {
  if (!lastCount) return null
  if (lastCount.includes("TD"))
    return {
      background: "rgba(110, 135, 118, 0.15)",
      color: "oklch(0.84 0.09 150)",
      borderColor: "rgb(60, 78, 66)",
    }
  if (lastCount.includes("LIB"))
    return {
      background: "rgba(185, 128, 52, 0.15)",
      color: "oklch(0.87 0.11 86)",
      borderColor: "rgb(100, 68, 28)",
    }
  if (lastCount.includes("Debut"))
    return {
      background: "rgba(200, 88, 108, 0.15)",
      color: "oklch(0.84 0.12 12)",
      borderColor: "rgb(100, 44, 58)",
    }
  return null
}

/**
 * WL Home v2 setlist: personnel links use the same pill shape and treatment as
 * the Last column (translucent fill, oklch/rgba text, 1px solid border).
 * Categories align with `getPersonnelPillClassName` / `guest_category`.
 */
export function getPersonnelPillWlV2Style(
  guestCategory: string | null | undefined,
): { background: string; color: string; borderColor: string } {
  const cat = guestCategory?.trim()
  if (cat === "Goose (current)")
    return {
      background: "rgba(100, 132, 112, 0.2)",
      color: "oklch(0.86 0.1 150)",
      borderColor: "rgb(50, 78, 58)",
    }
  if (cat === "Goose (former)")
    return {
      background: "rgba(82, 95, 90, 0.11)",
      color: "oklch(0.72 0.035 165)",
      borderColor: "rgb(40, 46, 44)",
    }
  if (cat === "Group" || cat === "Guest")
    return {
      background: "rgba(198, 72, 82, 0.16)",
      color: "oklch(0.83 0.1 25)",
      borderColor: "rgb(112, 38, 44)",
    }
  return {
    background: "rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.22)",
  }
}

/** Background color for the # column based on entry placement (set opener/closer, encore). */
export function getPlacementIndexCellBg(placement: string | null): string {
  return getPlacementBarColor(placement)
}

export const LAST_HEADER_TOOLTIP = `Debut – first known time the song was played by Goose.
TD – Tour Debut: first time in the current tour.
LIB – Liberation: first time in more than a calendar year.`

/** Explanations for [short] labels in the Song column header tooltip. */
export const SHORT_EXPLANATIONS: Record<string, string> = {
  fake: "Song was played for a few seconds before stopping.",
  tease: "Short tease or snippet of the song.",
  aborted: "Song was started but stopped before finishing.",
  partial: "Partial performance.",
  abridged: "Shortened or abridged version.",
  reprise: "Reprise of a song played earlier in the show.",
  unfinished: "Song was not completed.",
}

/** JOTY round order for header tooltip; value is description. */
export const JOTY_EXPLANATIONS: Record<string, string> = {
  JOTY: "Jam of the Year winner",
  "2nd": "Second place",
  F4: "Final 4",
  E8: "Elite 8",
  S16: "Sweet 16",
  R32: "Round of 32",
  R64: "Round of 64",
}
export const JOTY_ROUND_ORDER = ["JOTY", "2nd", "F4", "E8", "S16", "R32", "R64"]

/**
 * WL Home v2: JOTY chips match Last-column pill treatment (translucent fill, oklch text, solid border).
 * Hue per round matches the classic solid badges; see `getJotyBadgeStyle` for legacy.
 */
export function getJotyPillWlV2Style(round: string): {
  background: string
  color: string
  borderColor: string
} {
  switch (round) {
    case "JOTY":
      return {
        background: "rgba(255, 200, 55, 0.18)",
        color: "oklch(0.9 0.11 72)",
        borderColor: "rgb(130, 95, 18)",
      }
    case "2nd":
      return {
        background: "rgba(115, 125, 135, 0.16)",
        color: "oklch(0.88 0.03 250)",
        borderColor: "rgb(55, 62, 72)",
      }
    case "F4":
      return {
        background: "rgba(175, 110, 58, 0.16)",
        color: "oklch(0.84 0.09 58)",
        borderColor: "rgb(95, 58, 30)",
      }
    case "E8":
      return {
        background: "rgba(130, 85, 225, 0.14)",
        color: "oklch(0.86 0.12 300)",
        borderColor: "rgb(72, 48, 118)",
      }
    case "S16":
      return {
        background: "rgba(58, 125, 235, 0.14)",
        color: "oklch(0.88 0.1 250)",
        borderColor: "rgb(32, 72, 135)",
      }
    case "R32":
      return {
        background: "rgba(28, 155, 115, 0.14)",
        color: "oklch(0.88 0.1 165)",
        borderColor: "rgb(22, 88, 65)",
      }
    case "R64":
      return {
        background: "rgba(188, 192, 198, 0.16)",
        color: "oklch(0.86 0.03 265)",
        borderColor: "rgb(78, 80, 86)",
      }
    default:
      return {
        background: "rgba(130, 130, 140, 0.14)",
        color: "oklch(0.86 0.03 260)",
        borderColor: "rgb(58, 60, 66)",
      }
  }
}

/** JOTY badge styling by round (label is round as-is). */
export function getJotyBadgeStyle(round: string): {
  style?: React.CSSProperties
  className: string
} {
  const base = "inline-flex items-center justify-center font-medium rounded-full shadow-sm w-8 h-4 text-[10px] shrink-0 px-1.5 py-0 border-0"
  switch (round) {
    case "JOTY":
      return {
        style: { background: "linear-gradient(#FFD700, #FFC700)" },
        className: `${base} text-gray-900`,
      }
    case "2nd":
      return {
        style: { backgroundColor: "#6B7280" },
        className: `${base} text-white`,
      }
    case "F4":
      return {
        style: { backgroundColor: "#CD7F32" },
        className: `${base} text-white`,
      }
    case "E8":
      return {
        style: { backgroundColor: "#8B5CF6" },
        className: `${base} text-white`,
      }
    case "S16":
      return {
        style: { backgroundColor: "#3B82F6" },
        className: `${base} text-white`,
      }
    case "R32":
      return {
        style: { backgroundColor: "#10B981" },
        className: `${base} text-white`,
      }
    case "R64":
      return {
        className: `${base} bg-gray-300 text-gray-800 dark:bg-gray-400 dark:text-gray-900`,
      }
    default:
      return {
        className: `${base} bg-gray-400 text-white`,
      }
  }
}
