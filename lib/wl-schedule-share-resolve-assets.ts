import type { RadioScheduleSlot } from "@/hooks/use-radio-schedule"
import {
  getScheduleShareProxiedBlobUrl,
  scheduleShareExportImageNeedsProxy,
} from "@/lib/wl-schedule-share-proxy-image"
import { resolveScheduleShareStoreBadgeDataUrls } from "@/lib/wl-schedule-share-store-badge-raster"

export type ScheduleShareResolvedAssets = {
  backgroundDataUrl: string
  brandMarkDataUrl: string
  storeBadgeIosDataUrl: string
  storeBadgeAndroidDataUrl: string
  rowArtDataUrlByKey: Record<string, string>
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("FileReader did not return a string"))
    }
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"))
    reader.readAsDataURL(blob)
  })
}

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl)
  if (!res.ok) throw new Error(`Failed to read blob URL (${res.status})`)
  return blobToDataUrl(await res.blob())
}

async function sameOriginAssetToDataUrl(path: string): Promise<string> {
  const url = new URL(path, window.location.origin).href
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`)
  return blobToDataUrl(await res.blob())
}

/** Fetch remote/proxied artwork and return a PNG data URL safe for canvas + html-to-image on iOS. */
async function artworkHrefToDataUrl(href: string): Promise<string> {
  const trimmed = href.trim()
  if (!trimmed) throw new Error("Empty artwork URL")
  if (trimmed.startsWith("data:")) return trimmed

  if (scheduleShareExportImageNeedsProxy(trimmed)) {
    const blobUrl = await getScheduleShareProxiedBlobUrl(trimmed)
    return blobUrlToDataUrl(blobUrl)
  }

  const abs = trimmed.startsWith("/") ?
      new URL(trimmed, window.location.origin).href
    : trimmed.startsWith("//") ?
      `https:${trimmed}`
    : trimmed

  const res = await fetch(abs, { mode: "cors" })
  if (!res.ok) throw new Error(`Failed to fetch artwork (${res.status})`)
  return blobToDataUrl(await res.blob())
}

export function scheduleShareRowArtKey(slot: RadioScheduleSlot): string {
  return `${slot.event.event_id}-${slot.event.start}`
}

/**
 * Preload every bitmap used in the schedule export card as data URLs so capture
 * does not depend on iOS painting hidden or async <img> nodes.
 */
export async function resolveScheduleShareExportAssets(
  backgroundSrc: string,
  slots: RadioScheduleSlot[],
): Promise<ScheduleShareResolvedAssets> {
  const rowArtDataUrlByKey: Record<string, string> = {}

  const rowTasks = slots.map(async (slot) => {
    const artwork =
      slot.wtedEpisode?.artwork?.trim() ||
      slot.event.playlist.artwork?.trim() ||
      ""
    if (!artwork) return
    const key = scheduleShareRowArtKey(slot)
    try {
      rowArtDataUrlByKey[key] = await artworkHrefToDataUrl(artwork)
    } catch (e) {
      console.warn("Schedule share: row artwork resolve failed", artwork, e)
    }
  })

  const [backgroundDataUrl, brandMarkDataUrl, storeBadges] = await Promise.all([
    backgroundSrc.startsWith("data:") ?
      Promise.resolve(backgroundSrc)
    : sameOriginAssetToDataUrl(backgroundSrc),
    sameOriginAssetToDataUrl("/WTED3.png"),
    resolveScheduleShareStoreBadgeDataUrls(),
  ])

  await Promise.all(rowTasks)

  return {
    backgroundDataUrl,
    brandMarkDataUrl,
    storeBadgeIosDataUrl: storeBadges.ios,
    storeBadgeAndroidDataUrl: storeBadges.android,
    rowArtDataUrlByKey,
  }
}
