const WL_COMMUNITY_TOPIC_URL =
  /^https:\/\/community\.wysterialane\.org\/t\/[^/]+\/(\d+)\/?(?:\?.*)?$/i

/** Topic id from `shows.show_wl_link` (`…/t/{slug}/{topicId}`). */
export function parseWlCommunityTopicId(wlLink: string): number | null {
  const trimmed = wlLink.trim()
  const match = trimmed.match(WL_COMMUNITY_TOPIC_URL)
  if (!match) return null
  const id = Number.parseInt(match[1]!, 10)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

export function isValidWlCommunityTopicUrl(wlLink: string): boolean {
  return parseWlCommunityTopicId(wlLink) != null
}
