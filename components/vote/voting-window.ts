/** Voting stays open through 11:59pm ET on October 11, 2026. */
export const VOTING_CLOSES_AT_MS = Date.parse("2026-10-12T00:00:00-04:00")

export function isVotingClosed(now = Date.now()) {
  return now >= VOTING_CLOSES_AT_MS
}
