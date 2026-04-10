/** Prefer `wted_episodes.display_name`, fall back to `wted_episodes.episode`. */
export function getWtedEpisodeDisplayName(
  episode: string,
  displayName: string | null | undefined,
): string {
  const d = displayName?.trim()
  return d && d.length > 0 ? d : episode
}

export type WtedEpisodeOrderSortFields = {
  episode: string
  display_name: string | null
  order: number | null
}

/** `wted_episodes.order` ascending (nulls last), then display label. */
export function compareWtedEpisodesByOrderThenDisplayName(
  a: WtedEpisodeOrderSortFields,
  b: WtedEpisodeOrderSortFields,
): number {
  const ao = a.order ?? Number.MAX_SAFE_INTEGER
  const bo = b.order ?? Number.MAX_SAFE_INTEGER
  if (ao !== bo) return ao - bo
  return getWtedEpisodeDisplayName(a.episode, a.display_name).localeCompare(
    getWtedEpisodeDisplayName(b.episode, b.display_name),
    undefined,
    { sensitivity: "base" },
  )
}
