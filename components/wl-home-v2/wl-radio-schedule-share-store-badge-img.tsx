"use client"

import { useEffect, useState } from "react"

import { WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO } from "@/lib/wl-home-v2-radio-schedule-share-export-config"

/** Matches `.wl-radio-schedule-share-export__store-badge-img` height in CSS. */
const STORE_BADGE_DISPLAY_HEIGHT_PX = 68

const STORE_BADGE_SVG = {
  ios: { src: "/iOS.svg", intrinsicWidth: 119.66407, intrinsicHeight: 40 },
  android: { src: "/Android.svg", intrinsicWidth: 238.96, intrinsicHeight: 70.87 },
} as const

function rasterizeStoreBadgeSvg(
  src: string,
  intrinsicWidth: number,
  intrinsicHeight: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const pixelHeight =
        STORE_BADGE_DISPLAY_HEIGHT_PX *
        WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO
      const pixelWidth = Math.round(
        (intrinsicWidth / intrinsicHeight) * pixelHeight,
      )
      const canvas = document.createElement("canvas")
      canvas.width = pixelWidth
      canvas.height = pixelHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas 2D unavailable"))
        return
      }
      ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

/**
 * App Store / Play badges for schedule PNG export.
 * Rasterizes SVGs at export pixel density so html-to-image (especially iOS) does not capture soft vectors.
 */
export function WlRadioScheduleShareStoreBadgeImg({
  variant,
}: {
  variant: keyof typeof STORE_BADGE_SVG
}) {
  const spec = STORE_BADGE_SVG[variant]
  const [hiResSrc, setHiResSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    rasterizeStoreBadgeSvg(spec.src, spec.intrinsicWidth, spec.intrinsicHeight)
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
  }, [spec.intrinsicHeight, spec.intrinsicWidth, spec.src])

  const displayWidth = Math.round(
    (spec.intrinsicWidth / spec.intrinsicHeight) * STORE_BADGE_DISPLAY_HEIGHT_PX,
  )
  const pixelWidth =
    displayWidth * WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO
  const pixelHeight =
    STORE_BADGE_DISPLAY_HEIGHT_PX *
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
