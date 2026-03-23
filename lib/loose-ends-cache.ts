import type { GroupedLooseEnds } from "@/types/loose-ends"

export interface LooseEndsCachePayload {
  groupedLooseEnds: GroupedLooseEnds
  categories: string[]
  attendedShowCount: number
}

const cache = new Map<string, LooseEndsCachePayload>()

export function getLooseEndsFromSessionCache(
  userId: string
): LooseEndsCachePayload | undefined {
  return cache.get(userId)
}

export function setLooseEndsSessionCache(
  userId: string,
  payload: LooseEndsCachePayload
): void {
  cache.set(userId, payload)
}

export function clearLooseEndsSessionCache(userId: string): void {
  cache.delete(userId)
}
