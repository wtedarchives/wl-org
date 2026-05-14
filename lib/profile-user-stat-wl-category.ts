/**
 * WL Home category markers for profile user stats — class names must match
 * `getTopSlotsCategoryClassName` / `.wl-home-v2-top-slots-cat--*` in `wl-home-v2.css`.
 */
const PROFILE_STAT_WL_CAT: Record<string, string> = {
  showOpeners: "wl-home-v2-top-slots-cat--show-openers",
  setOpeners: "wl-home-v2-top-slots-cat--set-openers",
  setClosers: "wl-home-v2-top-slots-cat--set-closers",
  encoreSongs: "wl-home-v2-top-slots-cat--encores",
}

export function getProfileUserStatCategoryClass(statType: string): string {
  return PROFILE_STAT_WL_CAT[statType] ?? "wl-home-v2-top-slots-cat--fallback"
}
