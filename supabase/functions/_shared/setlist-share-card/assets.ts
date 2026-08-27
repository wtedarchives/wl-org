/**
 * Card image assets: background photos and the brand mark.
 *
 * The bytes are embedded as base64 modules under `./generated/`, not read from
 * disk — Supabase Edge Functions bundle only the reachable module graph, so a
 * sibling `.jpg` is simply absent at runtime and `Deno.readFile` fails with
 * "path not found". Regenerate with `scripts/build-share-card-embeds.ts`.
 *
 * The backgrounds are the pre-treated variants from
 * `scripts/build-share-card-assets.ts`: Satori cannot apply the CSS `filter`
 * the browser card uses, so the grayscale/brightness pass is baked in.
 */
import {
  BRAND_MARK_DATA_URI,
  CARD_BACKGROUND_DATA_URI,
} from "./generated/backgrounds.ts"

/** Matches WL_HOME_V2_SHARE_BACKGROUNDS, minus the file extensions. */
export const SHARE_BACKGROUND_STEMS = ["newbg", "newbg2", "newbg3", "newbg4"] as const

/**
 * Stable per show, so successive posts during one show share a background.
 * Same hash as `pickShareBackgroundForShow` on the web.
 */
export function pickShareBackgroundStem(showId: string): string {
  let hash = 0
  for (let i = 0; i < showId.length; i += 1) {
    hash = (hash * 31 + showId.charCodeAt(i)) >>> 0
  }
  return SHARE_BACKGROUND_STEMS[hash % SHARE_BACKGROUND_STEMS.length]!
}

/** Treated background for the card's own frame. */
export function cardBackground(stem: string): string {
  const hit = CARD_BACKGROUND_DATA_URI[stem]
  if (!hit) throw new Error(`No embedded card background for "${stem}"`)
  return hit
}

export function brandMark(): string {
  return BRAND_MARK_DATA_URI
}
