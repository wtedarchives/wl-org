/** Homepage tile backgrounds used for randomized setlist share images (match WL Home v2 tiles). */
export const WL_HOME_V2_SHARE_BACKGROUNDS = [
  "/newbg.png",
  "/newbg2.jpeg",
  "/newbg3.jpeg",
  "/newbg4.jpeg",
] as const

export function pickRandomShareBackground(): string {
  const list = WL_HOME_V2_SHARE_BACKGROUNDS
  const i = Math.floor(Math.random() * list.length)
  return list[i]!
}

/** Same background for a show on every load — cloud screenshots stay consistent. */
export function pickShareBackgroundForShow(showId: string): string {
  const list = WL_HOME_V2_SHARE_BACKGROUNDS
  let hash = 0
  for (let i = 0; i < showId.length; i += 1) {
    hash = (hash * 31 + showId.charCodeAt(i)) >>> 0
  }
  return list[hash % list.length]!
}
