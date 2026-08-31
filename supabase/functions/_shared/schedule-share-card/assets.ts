/**
 * Schedule-card image assets: story backgrounds and the brand mark.
 *
 * The bytes live in `./generated/assets.ts` rather than on disk — neither
 * Supabase Edge nor Netlify's esbuild bundler uploads a sibling file, so
 * anything the renderer needs has to arrive as code. Regenerate with
 * `deno run -A scripts/build-schedule-share-card-embeds.ts`.
 *
 * These are NOT the setlist card's backgrounds: same four photos and the same
 * baked-in treatment, but cropped 9∶16 for the story frame instead of 4:5.
 */
import {
  SCHEDULE_BACKGROUND_DATA_URI,
  SCHEDULE_BRAND_MARK_DATA_URI,
} from "./generated/assets.ts"
import type { ScheduleCardAssets } from "./card.ts"

/** Matches WL_HOME_V2_SHARE_BACKGROUNDS, minus the file extensions. */
export const SCHEDULE_BACKGROUND_STEMS = [
  "newbg",
  "newbg2",
  "newbg3",
  "newbg4",
] as const

export type ScheduleBackgroundStem =
  (typeof SCHEDULE_BACKGROUND_STEMS)[number]

/**
 * Stable per day key, so re-rendering the same day twice gives the same card
 * while a week of days still varies. Same hash as `pickShareBackgroundForShow`.
 */
export function pickScheduleBackgroundStem(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return SCHEDULE_BACKGROUND_STEMS[hash % SCHEDULE_BACKGROUND_STEMS.length]!
}

export function scheduleCardAssets(stem: string): ScheduleCardAssets {
  const backgroundSrc = SCHEDULE_BACKGROUND_DATA_URI[stem]
  if (!backgroundSrc) {
    throw new Error(`No embedded schedule background for "${stem}"`)
  }
  return {
    backgroundSrc,
    brandMarkSrc: SCHEDULE_BRAND_MARK_DATA_URI,
  }
}
