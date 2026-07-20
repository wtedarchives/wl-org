/** Canonical WTED episode URL (query `id` = `wted_episodes.uuid`). */
export function getWtedEpisodeUrl(episodeId: string): string {
  return `/radio/episode?id=${encodeURIComponent(episodeId)}`
}
