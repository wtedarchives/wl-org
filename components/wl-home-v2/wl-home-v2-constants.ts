/** Discourse / community hub (planned: https://community.wted.org when live). */
export const WL_HOME_V2_COMMUNITY_URL = "https://community.wysterialane.org"

/** Rotating lines for homepage ticker (`WlHomeV2`). */
export const WL_HOME_V2_TICKER_RANDOM_PHRASES = [
  "Visions of members vast.",
  "So ready for this.",
  "It's alright–don't sweat my friend.",
  "Go everywhere, feel everything, see everyone.",
  "Keep it Ted!",
  "Just a little bit goes a long, long way.",
  "Down the pathway to the great beyond.",
  "Come and get some pancakes!",
  "Seep up all the light.",
  "Is it all vision?",
] as readonly string[]

/** Pick uniformly at random, never identical to `previous` when more than one line exists. */
export function pickNextWlHomeTickerPhrase(previous: string | null): string {
  const list = WL_HOME_V2_TICKER_RANDOM_PHRASES
  const n = list.length
  if (n === 0) return ""
  if (n === 1) return list[0]
  let next: string
  do {
    next = list[Math.floor(Math.random() * n)]!
  } while (next === previous)
  return next
}

/**
 * Four phrases shown in sequence per marquee sweep (welcome + phrase × 4 rounds).
 * Adjacent phrases differ; last ≠ first so the duplicated strip doesn’t show the same
 * phrase back-to-back at the seam. `precedingEndPhrase` joins cleanly after a quad refresh (≠ new p₀).
 */
export function pickWlHomeTickerPhraseQuad(
  precedingEndPhrase: string | null,
): readonly [string, string, string, string] {
  const list = WL_HOME_V2_TICKER_RANDOM_PHRASES
  const n = list.length
  if (n <= 1) {
    const p = list[0] ?? ""
    return [p, p, p, p]
  }
  const p0 = pickNextWlHomeTickerPhrase(precedingEndPhrase)
  const p1 = pickNextWlHomeTickerPhrase(p0)
  const p2 = pickNextWlHomeTickerPhrase(p1)

  let p3: string
  let guard = 0
  do {
    p3 = list[Math.floor(Math.random() * n)]!
    guard++
  } while ((p3 === p2 || p3 === p0) && guard < 260)

  if (p3 === p2 || p3 === p0) {
    const fallback = list.find((s) => s !== p2 && s !== p0)
    p3 =
      fallback
      ??
      pickNextWlHomeTickerPhrase(p2)
  }

  return [p0, p1, p2, p3]
}

/**
 * Fixed id for the primary mobile nav region (`#` + this string on `<nav>`). Avoids
 * `useId`/`aria-controls` hydration mismatches when the header’s first subtree (e.g. radio slot)
 * differs in hook order between server and client.
 */
export const WL_HOME_V2_TOP_NAV_PANEL_ID = "wl-home-v2-top-nav-panel"
