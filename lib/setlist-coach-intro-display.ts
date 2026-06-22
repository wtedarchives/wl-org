import type { SetlistEntry } from "@/types/setlist"

/** Entire coach note is dropped from the coach column; intro label still shown in song cell. */
export const COACH_INTRO_DISCARD_ENTIRE_COACH_NOTES =
  'very brief <a href="/archive/song?id=00f7a0ca-38e4-45d8-b0b3-58dd956c4042">(begin)</a> intro'

/** Coach note and song cell are left unchanged. */
export const COACH_INTRO_LEAVE_UNCHANGED =
  'first known time played without <a href="/archive/song?id=b0382ec0-784c-4a68-a992-b2d4ed8c2735">.....</a> intro'

const COACH_INTRO_FRAGMENTS = [
  {
    fragment:
      '<a href="/archive/song?id=00f7a0ca-38e4-45d8-b0b3-58dd956c4042">(begin)</a> intro',
    anchorLabel: "(begin)",
  },
  {
    fragment:
      '<a href="/archive/song?id=b0382ec0-784c-4a68-a992-b2d4ed8c2735">.....</a> intro',
    anchorLabel: ".....",
  },
  {
    fragment:
      '<a href="/archive/song?id=17347845-b7a1-475b-9d8d-9eec7762a23a">Interlude I</a> intro',
    anchorLabel: "Interlude I",
  },
  {
    fragment:
      '<a href="/archive/song?id=0dfbcfde-70ee-4fb4-a5b3-b6a40cfc120d">Interlude II</a> intro',
    anchorLabel: "Interlude II",
  },
] as const

export type CoachIntroDisplayResult = {
  songAltName: string
  displayCoachNotes: string | null
}

function formatCoachIntroAltName(
  anchorLabel: string,
  entry: SetlistEntry,
): string {
  const songLabel =
    entry.songs?.song_displayname?.trim() || entry.entry_song
  const trimmedAnchor = anchorLabel.trim()
  if (trimmedAnchor.startsWith("(") && trimmedAnchor.endsWith(")")) {
    return `${trimmedAnchor} ${songLabel}`
  }
  return `(${trimmedAnchor}) ${songLabel}`
}

function findCoachIntroFragment(coachNotes: string) {
  return COACH_INTRO_FRAGMENTS.find(({ fragment }) =>
    coachNotes.includes(fragment),
  )
}

/** Strip matched intro fragments from semicolon-separated coach notes. */
export function stripCoachIntroFragmentFromNotes(
  coachNotes: string,
  fragment: string,
): string | null {
  const segments = coachNotes
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
  const remaining = segments.filter((segment) => !segment.includes(fragment))
  return remaining.length > 0 ? remaining.join("; ") : null
}

/**
 * When coach notes contain a known intro link, move that label into the song
 * column (alt_name-style) and return the remaining coach notes HTML.
 */
export function getCoachIntroDisplay(
  entry: SetlistEntry,
): CoachIntroDisplayResult | null {
  const raw = entry.entry_coachnotes?.trim()
  if (!raw) return null

  if (raw === COACH_INTRO_LEAVE_UNCHANGED) return null

  const matched = findCoachIntroFragment(raw)
  if (!matched) return null

  if (raw === COACH_INTRO_DISCARD_ENTIRE_COACH_NOTES) {
    return {
      songAltName: formatCoachIntroAltName(matched.anchorLabel, entry),
      displayCoachNotes: null,
    }
  }

  return {
    songAltName: formatCoachIntroAltName(matched.anchorLabel, entry),
    displayCoachNotes: stripCoachIntroFragmentFromNotes(raw, matched.fragment),
  }
}
