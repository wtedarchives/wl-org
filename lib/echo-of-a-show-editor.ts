import type { SongPick } from "@/components/dpro/setlistgame/song-selection/types"
import { generatePickId, getSetDisplayName } from "@/components/dpro/setlistgame/song-selection/utils"

export const ECHO_WILDCARD_ORIGINAL = "[New Original Song]"
export const ECHO_WILDCARD_COVER = "[New Cover Song]"
export const ECHO_MAX_SETS = 5
export const ECHO_MAX_ENCORES = 3

export function isEchoWildcard(song: string): boolean {
  return song === ECHO_WILDCARD_ORIGINAL || song === ECHO_WILDCARD_COVER
}

export function echoWildcardCount(picks: SongPick[]): number {
  return picks.filter((pick) => !pick.isBreak && isEchoWildcard(pick.song)).length
}

function setRank(set: string): number {
  if (set.startsWith("E")) return 100 + (Number.parseInt(set.slice(1), 10) || 0)
  return Number.parseInt(set, 10) || 0
}

export function echoBoardSets(picks: SongPick[]): string[] {
  const fromPicks = [...new Set(picks.map((pick) => pick.set))].sort(
    (a, b) => setRank(a) - setRank(b),
  )
  return fromPicks.length > 0 ? fromPicks : ["1"]
}

export function echoSongsInSet(picks: SongPick[], set: string): SongPick[] {
  return picks
    .filter((pick) => pick.set === set && !pick.isBreak)
    .sort((a, b) => a.setnum - b.setnum)
}

export function echoAllSongs(picks: SongPick[]): SongPick[] {
  return echoBoardSets(picks).flatMap((set) => echoSongsInSet(picks, set))
}

export function echoPickedSongSet(
  picks: SongPick[],
  song: string,
): string | null {
  if (isEchoWildcard(song)) return null
  return picks.find((pick) => !pick.isBreak && pick.song === song)?.set ?? null
}

export function echoAppendSong(
  picks: SongPick[],
  song: string,
  set: string,
): SongPick[] | "duplicate" {
  if (echoPickedSongSet(picks, song)) return "duplicate"
  const maxNum = Math.max(
    0,
    ...picks.filter((pick) => !pick.isBreak).map((pick) => pick.setnum),
  )
  return [
    ...picks,
    {
      id: generatePickId(),
      song,
      set,
      setnum: maxNum + 1,
    },
  ]
}

export function echoMovePick(
  picks: SongPick[],
  pickId: string,
  targetSet: string,
  beforePickId: string | null,
): SongPick[] {
  const pick = picks.find((item) => item.id === pickId)
  if (!pick || pick.isBreak) return picks
  const setSongs = echoSongsInSet(picks, targetSet).filter(
    (item) => item.id !== pickId,
  )
  let newNum: number
  if (!beforePickId || setSongs.length === 0) {
    newNum = (setSongs[setSongs.length - 1]?.setnum ?? 0) + 1
  } else {
    const index = setSongs.findIndex((item) => item.id === beforePickId)
    const at = index >= 0 ? index : setSongs.length
    const prev = at > 0 ? setSongs[at - 1]!.setnum : 0
    const next = setSongs[at]?.setnum ?? prev + 2
    newNum = (prev + next) / 2
  }
  return picks.map((item) =>
    item.id === pickId ? { ...item, set: targetSet, setnum: newNum } : item,
  )
}

export function echoCanAddColumn(picks: SongPick[]): boolean {
  const sets = echoBoardSets(picks)
  const regular = sets.filter((set) => !set.startsWith("E")).length
  const encores = sets.filter((set) => set.startsWith("E")).length
  return regular < ECHO_MAX_SETS || encores < ECHO_MAX_ENCORES
}

export function echoAddColumn(picks: SongPick[]): {
  picks: SongPick[]
  currentSet: string
} | null {
  const sets = echoBoardSets(picks)
  const regular = sets.filter((set) => !set.startsWith("E"))
  const highestRegular =
    regular.length > 0
      ? Math.max(...regular.map((set) => Number.parseInt(set, 10) || 0))
      : 0
  if (highestRegular < ECHO_MAX_SETS) {
    const next = String(highestRegular + 1)
    return {
      currentSet: next,
      picks: [
        ...picks,
        {
          id: generatePickId(),
          song: `--- ${getSetDisplayName(next)} ---`,
          set: next,
          setnum: 0,
          isBreak: true,
        },
      ],
    }
  }
  const encores = sets.filter((set) => set.startsWith("E"))
  const highestEncore =
    encores.length > 0
      ? Math.max(
          ...encores.map((set) => Number.parseInt(set.slice(1), 10) || 0),
        )
      : 0
  if (highestEncore < ECHO_MAX_ENCORES) {
    const next = `E${highestEncore + 1}`
    return {
      currentSet: next,
      picks: [
        ...picks,
        {
          id: generatePickId(),
          song: `--- ${getSetDisplayName(next)} ---`,
          set: next,
          setnum: 0,
          isBreak: true,
        },
      ],
    }
  }
  return null
}

export function echoEditorPill(
  pick: SongPick,
  setSongs: SongPick[],
  allSongs: SongPick[],
): { label: string; placement: string } | null {
  const lastOverall = allSongs[allSongs.length - 1]
  if (lastOverall?.id === pick.id && allSongs.length > 1) {
    return { label: "Show closer · auto", placement: "Encore 1" }
  }
  if (pick.set.startsWith("E")) return null
  const index = setSongs.findIndex((item) => item.id === pick.id)
  if (index < 0) return null
  if (index === 0) {
    return {
      label: "Set opener · auto",
      placement: pick.placement ?? `Set ${pick.set} Opener`,
    }
  }
  if (index === setSongs.length - 1 && setSongs.length > 1) {
    return {
      label: "Set closer · auto",
      placement: pick.placement ?? `Set ${pick.set} Closer`,
    }
  }
  return null
}
