export const WL_HOME_V2_STATS_DEFAULT_YEAR = 2026

export const WL_HOME_V2_STATS_YEARS = [
  "all-time",
  ...Array.from({ length: 13 }, (_, i) => WL_HOME_V2_STATS_DEFAULT_YEAR - i),
] as const

/**
 * Header accent swatch classes — same hues as tour slot tiles; defined in
 * wl-home-v2.css (`.wl-home-v2-top-slots-cat--*`).
 */
export const WL_HOME_V2_STATS_TILE_ACCENT_CLASSES = {
  topShowOpeners: "wl-home-v2-top-slots-cat--show-openers",
  topSetOpeners: "wl-home-v2-top-slots-cat--set-openers",
  topSetClosers: "wl-home-v2-top-slots-cat--set-closers",
  topEncores: "wl-home-v2-top-slots-cat--encores",
} as const
