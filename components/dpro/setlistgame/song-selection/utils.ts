import type { SongPick, SetlistEntry, TimeRemainingResult } from "./types"

export const calculateTimeRemaining = (
  showTime: string
): TimeRemainingResult => {
  const now = new Date()
  const showDateTime = new Date(showTime)
  const oneHourBefore = new Date(showDateTime)
  oneHourBefore.setHours(oneHourBefore.getHours() - 1)

  const isSelectionClosed = now >= oneHourBefore

  let timeRemaining = ""
  if (!isSelectionClosed) {
    const timeDiff = oneHourBefore.getTime() - now.getTime()
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      timeRemaining = `${days}d ${hours}h`
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m`
    } else {
      timeRemaining = `${minutes}m`
    }
  }

  return { timeRemaining, isSelectionClosed }
}

export const getSetDisplayName = (set: string): string => {
  if (set === "E1") return "Encore"
  if (set === "E2") return "2nd Encore"
  if (set === "E3") return "3rd Encore"
  return `Set ${set}`
}

export const getPlacementColor = (placement: string | undefined): string => {
  if (!placement) return "transparent"
  const colorMap: Record<string, string> = {
    "Set 1 Opener": "#047857",
    "Set 1 Closer": "#1e40af",
    "Set 2 Opener": "#10b981",
    "Set 3 Opener": "#10b981",
    "Set 4 Opener": "#10b981",
    "Set 5 Opener": "#10b981",
    "Set 2 Closer": "#3b82f6",
    "Set 3 Closer": "#3b82f6",
    "Set 4 Closer": "#3b82f6",
    "Set 5 Closer": "#3b82f6",
    "Encore 1": "#be123c",
    "Encore 2": "#f43f5e",
    "Encore 3": "#f43f5e",
  }
  return colorMap[placement] ?? "#000000"
}

export const getPlacement = (
  set: string,
  songs: SongPick[],
  currentSong: SongPick
): string => {
  const sortedSongs = [...songs].sort((a, b) => a.setnum - b.setnum)
  if (set.startsWith("E")) return `Encore ${set.substring(1)}`
  const songIndex = sortedSongs.findIndex((s) => s.id === currentSong.id)
  if (sortedSongs.length === 1) return `Set ${set} Opener`
  if (songIndex === 0) return `Set ${set} Opener`
  if (songIndex === sortedSongs.length - 1) return `Set ${set} Closer`
  return `Main Set ${set}`
}

export const getUniqueSets = (songPicks: SongPick[]): string[] => {
  const setsWithPicks = new Set(songPicks.map((p) => p.set))
  const numericSets = Array.from(setsWithPicks)
    .filter((s) => !s.startsWith("E"))
    .sort((a, b) => parseInt(a) - parseInt(b))
  const encoreSets = Array.from(setsWithPicks)
    .filter((s) => s.startsWith("E"))
    .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)))
  return [...numericSets, ...encoreSets]
}

export const getAllUniqueSets = (
  songPicks: SongPick[],
  actualSetlist: SetlistEntry[]
): string[] => {
  const userSets = new Set(songPicks.map((p) => p.set))
  const actualSets = new Set(actualSetlist.map((e) => e.entry_set))
  const allSets = new Set([...userSets, ...actualSets])
  const numericSets = Array.from(allSets)
    .filter((s) => !s.startsWith("E"))
    .sort((a, b) => parseInt(a) - parseInt(b))
  const encoreSets = Array.from(allSets)
    .filter((s) => s.startsWith("E"))
    .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)))
  return [...numericSets, ...encoreSets]
}

export const getSongsForSet = (songPicks: SongPick[], set: string): SongPick[] =>
  songPicks
    .filter((p) => p.set === set && !p.isBreak)
    .sort((a, b) => a.setnum - b.setnum)

export const getSongsForActualSet = (
  actualSetlist: SetlistEntry[],
  set: string
): SetlistEntry[] =>
  actualSetlist
    .filter((e) => e.entry_set === set)
    .sort((a, b) => a.entry_setnum - b.entry_setnum)

export const generatePickId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2)

export const getResultDescription = (
  result: string | undefined,
  showcloser_correct?: boolean,
  showopener_correct?: boolean
): string => {
  if (!result) return ""
  let description = ""
  switch (result) {
    case "not_played":
      return "❌ Song Not Played"
    case "correct_song":
      description = "✅ Song"
      break
    case "correct_song_set":
      description = "✅ Song<br>✅ Set"
      break
    case "correct_song_set_setnum":
      description = "✅ Song<br>✅ Set<br>✅ Set Position"
      break
    case "correct_song_openercloserencore":
      description = "✅ Song<br>✅ Opener/Closer/Encore<br>❌ Set"
      break
    case "correct_song_set_openercloserencore":
      description = "✅ Song<br>✅ Opener/Closer/Encore<br>✅ Set"
      break
    case "correct_song_set_setnum_openercloserencore":
      description =
        "✅ Song<br>✅ Opener/Closer/Encore<br>✅ Set<br>✅ Set Position"
      break
    default:
      return result
  }
  if (showopener_correct) description += "<br>✅ Show Opener"
  if (showcloser_correct) description += "<br>✅ Show Closer"
  return description
}

export const getOrderedSets = (picks: SongPick[]): string[] => {
  const setsWithPicks = new Set(picks.map((p) => p.set))
  const numericSets = Array.from(setsWithPicks)
    .filter((s) => !s.startsWith("E"))
    .sort((a, b) => parseInt(a) - parseInt(b))
  const encoreSets = Array.from(setsWithPicks)
    .filter((s) => s.startsWith("E"))
    .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)))
  return [...numericSets, ...encoreSets]
}
