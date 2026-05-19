"use client"

import { useEffect, useState } from "react"

import {
  rasterizeScheduleShareStoreBadgeSvg,
  SCHEDULE_SHARE_STORE_BADGE_DISPLAY_HEIGHT_PX,
  SCHEDULE_SHARE_STORE_BADGE_SPECS,
} from "@/lib/wl-schedule-share-store-badge-raster"
import { WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO } from "@/lib/wl-home-v2-radio-schedule-share-export-config"

/**
 * App Store / Play badges for schedule PNG export.
 * When `src` is passed (pre-rasterized data URL from export asset resolution), use it directly.
 */
export function WlRadioScheduleShareStoreBadgeImg({
  variant,
  src: preResolvedSrc,
}: {
  variant: keyof typeof SCHEDULE_SHARE_STORE_BADGE_SPECS
  /** Pre-rasterized PNG data URL — skips async rasterization (required for reliable iOS capture). */
  src?: string
}) {
  const spec = SCHEDULE_SHARE_STORE_BADGE_SPECS[variant]
  const [hiResSrc, setHiResSrc] = useState<string | null>(preResolvedSrc ?? null)

  useEffect(() => {
    if (preResolvedSrc) {
      setHiResSrc(preResolvedSrc)
      return
    }
    let cancelled = false
    rasterizeScheduleShareStoreBadgeSvg(
      spec.src,
      spec.intrinsicWidth,
      spec.intrinsicHeight,
    )
      .then((url) => {
        if (!cancelled) setHiResSrc(url)
      })
      .catch((e) => {
        console.warn("Store badge rasterize failed; using SVG", e)
        if (!cancelled) setHiResSrc(spec.src)
      })
    return () => {
      cancelled = true
    }
  }, [preResolvedSrc, spec.intrinsicHeight, spec.intrinsicWidth, spec.src])

  const displayWidth = Math.round(
    (spec.intrinsicWidth / spec.intrinsicHeight) *
      SCHEDULE_SHARE_STORE_BADGE_DISPLAY_HEIGHT_PX,
  )
  const pixelWidth =
    displayWidth * WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO
  const pixelHeight =
    SCHEDULE_SHARE_STORE_BADGE_DISPLAY_HEIGHT_PX *
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO

  return (
    // eslint-disable-next-line @next/next/no-img-element -- PNG capture
    <img
      src={hiResSrc ?? spec.src}
      alt=""
      draggable={false}
      width={pixelWidth}
      height={pixelHeight}
      className="wl-radio-schedule-share-export__store-badge-img"
    />
  )
}
