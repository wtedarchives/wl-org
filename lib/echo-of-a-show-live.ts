import type { UserPick } from "@/hooks/use-user-picks"

export type EchoActualEntry = {
  entry_id: string
  entry_song: string
  entry_set: string
  entry_setnum: number
  entry_placement: string | null
  entry_new: string | null
}

export type EchoPickLiveStatus = "hit" | "miss" | "out"

export function echoSetDisplayName(set: string): string {
  if (set === "E1") return "Encore"
  if (set === "E2") return "2nd Encore"
  if (set === "E3") return "3rd Encore"
  return `Set ${set}`
}

export function echoSetOrder(set: string): number {
  if (set.startsWith("E")) return 100 + Number(set.slice(1) || 1)
  return Number(set) || 0
}

export function echoOrderedSets(
  picks: UserPick[],
  actual: EchoActualEntry[],
): string[] {
  const ids = new Set([
    ...picks.map((pick) => pick.set),
    ...actual.map((entry) => entry.entry_set),
  ])
  return [...ids].sort((a, b) => echoSetOrder(a) - echoSetOrder(b))
}

export function echoLiveSetLabel(actual: EchoActualEntry[]): string {
  const last = actual[actual.length - 1]
  if (!last) return "Waiting"
  return `${echoSetDisplayName(last.entry_set)} · live`
}

export function echoLaterSetStarted(
  actual: EchoActualEntry[],
  setId: string,
): boolean {
  const order = echoSetOrder(setId)
  return actual.some((entry) => echoSetOrder(entry.entry_set) > order)
}

export function echoEntryMatchesPick(
  entry: EchoActualEntry,
  pick: UserPick,
): boolean {
  if (pick.song === "[New Original Song]") {
    return entry.entry_new === "New Original Song"
  }
  if (pick.song === "[New Cover Song]") {
    return entry.entry_new === "New Cover Song"
  }
  return pick.song === entry.entry_song
}

export function echoPickMatchesActual(
  pick: UserPick,
  actual: EchoActualEntry[],
): boolean {
  return actual.some((entry) => echoEntryMatchesPick(entry, pick))
}

export function echoPickLiveStatus(
  pick: UserPick,
  actual: EchoActualEntry[],
): EchoPickLiveStatus {
  if (echoPickMatchesActual(pick, actual)) return "hit"
  if (echoLaterSetStarted(actual, pick.set)) return "miss"
  return "out"
}

export function echoLastSongDelta(
  picks: UserPick[],
  actual: EchoActualEntry[],
): { name: string; score: number | null } | null {
  const last = actual[actual.length - 1]
  if (!last) return null
  const hit = picks.find((pick) => echoEntryMatchesPick(last, pick))
  return {
    name: last.entry_song,
    score: hit?.score ?? null,
  }
}

export function echoProvisionalRank(
  scores: number[],
  you: number,
): number {
  return scores.filter((score) => score > you).length + 1
}

export function echoSongsForSet<T extends { set: string; setnum: number }>(
  picks: T[],
  setId: string,
): T[] {
  return picks
    .filter((pick) => pick.set === setId)
    .sort((a, b) => a.setnum - b.setnum)
}

export function echoActualForSet(
  actual: EchoActualEntry[],
  setId: string,
): EchoActualEntry[] {
  return actual
    .filter((entry) => entry.entry_set === setId)
    .sort((a, b) => a.entry_setnum - b.entry_setnum)
}

export function echoSetPoints(
  picks: UserPick[],
  actual: EchoActualEntry[],
  setId: string,
): number {
  return echoSongsForSet(picks, setId).reduce((sum, pick) => {
    if (echoPickLiveStatus(pick, actual) !== "hit") return sum
    return sum + (pick.score ?? 0)
  }, 0)
}
