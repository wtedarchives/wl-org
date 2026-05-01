export const WL_HOME_V2_STATS_DEFAULT_YEAR = 2026

export const WL_HOME_V2_STATS_YEARS = [
  "all-time",
  ...Array.from({ length: 13 }, (_, i) => WL_HOME_V2_STATS_DEFAULT_YEAR - i),
] as const

/**
 * Header accent swatches — tour slot tiles (openers/closers/encores) align with
 * `SLOT_COLORS` in `top-slots-carousel.tsx`.
 */
export const WL_HOME_V2_STATS_TILE_ACCENTS = {
  topShowOpeners: "#047857",
  topSetOpeners: "#10b981",
  topSetClosers: "#3b82f6",
  topEncores: "#be123c",
} as const
