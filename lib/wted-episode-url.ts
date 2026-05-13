/** Canonical WTED episode URL (query `id` = `wted_episodes.uuid`). */
export function getWtedEpisodeUrl(episodeId: string): string {
  return `/wted/episode?id=${encodeURIComponent(episodeId)}`
}

/** Legacy episode page (previous sidebar layout). */
export function getWtedOldEpisodeUrl(episodeId: string): string {
  return `/old/wted/episode?id=${encodeURIComponent(episodeId)}`
}
