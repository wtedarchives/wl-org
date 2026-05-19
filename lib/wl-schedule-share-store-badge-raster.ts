import { WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO } from "@/lib/wl-home-v2-radio-schedule-share-export-config"

/** Matches `.wl-radio-schedule-share-export__store-badge-img` height in CSS. */
export const SCHEDULE_SHARE_STORE_BADGE_DISPLAY_HEIGHT_PX = 68

export const SCHEDULE_SHARE_STORE_BADGE_SPECS = {
  ios: { src: "/iOS.svg", intrinsicWidth: 119.66407, intrinsicHeight: 40 },
  android: { src: "/Android.svg", intrinsicWidth: 238.96, intrinsicHeight: 70.87 },
} as const

export function rasterizeScheduleShareStoreBadgeSvg(
  src: string,
  intrinsicWidth: number,
  intrinsicHeight: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const pixelHeight =
        SCHEDULE_SHARE_STORE_BADGE_DISPLAY_HEIGHT_PX *
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

export async function resolveScheduleShareStoreBadgeDataUrls(): Promise<{
  ios: string
  android: string
}> {
  const [ios, android] = await Promise.all([
    rasterizeScheduleShareStoreBadgeSvg(
      SCHEDULE_SHARE_STORE_BADGE_SPECS.ios.src,
      SCHEDULE_SHARE_STORE_BADGE_SPECS.ios.intrinsicWidth,
      SCHEDULE_SHARE_STORE_BADGE_SPECS.ios.intrinsicHeight,
    ),
    rasterizeScheduleShareStoreBadgeSvg(
      SCHEDULE_SHARE_STORE_BADGE_SPECS.android.src,
      SCHEDULE_SHARE_STORE_BADGE_SPECS.android.intrinsicWidth,
      SCHEDULE_SHARE_STORE_BADGE_SPECS.android.intrinsicHeight,
    ),
  ])
  return { ios, android }
}
