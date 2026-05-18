/** Design width for radio schedule story export (9∶16). Wider than setlist share for list readability. */
export const WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX = 480

/** Portrait 9∶16 → height = width × (16/9). */
export const WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX = Math.round(
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX * (16 / 9),
)

/** Same pixel density as setlist share PNGs. */
export const WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO = 5

/**
 * Instagram Stories: keep non-background UI out of the top/bottom bands
 * (250px each at 1080×1920). Scaled to our logical frame height so exports stay proportional.
 */
export const WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_REF_HEIGHT_PX = 1920
export const WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_CLEAR_BAND_PX = 250

export const WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_SAFE_INSET_PX = Math.round(
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX *
    (WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_CLEAR_BAND_PX /
      WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_REF_HEIGHT_PX),
)
