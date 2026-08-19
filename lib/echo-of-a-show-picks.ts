import type { UserPick } from "@/hooks/use-user-picks"
import { getSetDisplayName } from "@/components/dpro/setlistgame/song-selection/utils"

function setRank(set: string): number {
  if (set.startsWith("E")) return 100 + (Number.parseInt(set.slice(1), 10) || 0)
  return Number.parseInt(set, 10) || 0
}

export function sortEchoPicks(picks: UserPick[]): UserPick[] {
  return [...picks].sort(
    (a, b) => setRank(a.set) - setRank(b.set) || a.setnum - b.setnum,
  )
}

export function echoUniqueSets(picks: UserPick[]): string[] {
  const sets = [...new Set(picks.map((pick) => pick.set))]
  return sets.sort((a, b) => setRank(a) - setRank(b))
}

export function echoSetCount(picks: UserPick[]): number {
  return echoUniqueSets(picks).length
}

export function echoOpenerSong(picks: UserPick[]): string | null {
  const sorted = sortEchoPicks(picks)
  return (
    sorted.find((pick) => pick.placement === "Set 1 Opener")?.song ??
    sorted[0]?.song ??
    null
  )
}

export function echoCloserSong(picks: UserPick[]): string | null {
  const sorted = sortEchoPicks(picks)
  return sorted[sorted.length - 1]?.song ?? null
}

export function echoBestCall(picks: UserPick[]): UserPick | null {
  const scored = picks.filter((pick) => (pick.score ?? 0) > 0)
  if (scored.length === 0) return null
  return scored.reduce((best, pick) =>
    (pick.score ?? 0) > (best.score ?? 0) ? pick : best,
  )
}

export function echoPlacementPillLabel(
  placement: string | null | undefined,
): string | null {
  if (!placement) return null
  if (/Opener$/i.test(placement)) return "Opener"
  if (/Closer$/i.test(placement)) return "Set closer"
  if (/^Encore/i.test(placement)) return placement
  return null
}

export function echoSetHeading(set: string, count?: number): string {
  const name = getSetDisplayName(set)
  if (count != null && count > 0) return `${name} · ${count} songs`
  return name
}
