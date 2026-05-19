import { toBlob } from "html-to-image"

import {
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX,
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX,
} from "@/lib/wl-home-v2-radio-schedule-share-export-config"

type ScheduleShareCaptureOptions = NonNullable<Parameters<typeof toBlob>[1]>

/** Off-screen / low-opacity capture layer (avoid negative z-index — iOS may skip painting). */
export const WL_SCHEDULE_SHARE_MOBILE_CAPTURE_LAYER_CLASS =
  "pointer-events-none fixed left-0 top-0 z-0 opacity-[0.01]"

export function isScheduleShareCaptureIOSWebKit(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

/**
 * Wait until proxied row art has mounted `<img>` nodes (not placeholders) and decoded.
 * `data-schedule-share-expected-row-art` is set on the export frame in the card component.
 */
export async function waitForScheduleShareCaptureReady(
  root: HTMLElement,
  timeoutMs = 20000,
): Promise<void> {
  const expectedRowArt = Number.parseInt(
    root.getAttribute("data-schedule-share-expected-row-art") ?? "0",
    10,
  )
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const rowArtImgs = root.querySelectorAll(
      ".wl-radio-schedule-share-export__row-art-img",
    )
    const pendingPlaceholders = root.querySelectorAll(
      ".wl-radio-schedule-share-export__row-art .wl-radio-schedule-share-export__row-art-placeholder",
    )
    const brandImg = root.querySelector<HTMLImageElement>(
      ".wl-radio-schedule-share-export__brand-mark-img",
    )
    const brandReady =
      !brandImg ||
      (brandImg.complete && (brandImg.naturalWidth ?? 0) > 0)

    const rowArtReady =
      rowArtImgs.length >= expectedRowArt && pendingPlaceholders.length === 0

    if (rowArtReady && brandReady) {
      await waitForScheduleShareCaptureImages(root, 3000)
      return
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100)
    })
  }

  await waitForScheduleShareCaptureImages(root, 3000)
}

export async function waitForScheduleShareCaptureImages(
  root: HTMLElement,
  timeoutMs = 5000,
): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"))
  if (imgs.length === 0) return
  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          img.complete && img.naturalWidth > 0 ?
            Promise.resolve()
          : new Promise<void>((resolve) => {
              const done = () => resolve()
              img.addEventListener("load", done, { once: true })
              img.addEventListener("error", done, { once: true })
            }),
      ),
    ),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs)
    }),
  ])
}

function imageElementToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D unavailable")
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL("image/png")
}

/**
 * Safari / html-to-image can fail to embed `blob:` and off-screen `<img>` pixels in the PNG.
 * Temporarily swap loaded images to data URLs, then restore after capture.
 */
async function inlineImagesForScheduleShareCapture(
  root: HTMLElement,
): Promise<() => void> {
  const restores: Array<() => void> = []
  const imgs = Array.from(root.querySelectorAll("img"))

  for (const img of imgs) {
    const prev = img.getAttribute("src")
    if (!prev || prev.startsWith("data:")) continue
    if (!img.complete || img.naturalWidth === 0) continue
    try {
      const dataUrl = imageElementToDataUrl(img)
      img.setAttribute("src", dataUrl)
      restores.push(() => {
        if (prev) img.setAttribute("src", prev)
      })
    } catch (e) {
      console.warn("Schedule share capture: could not inline image", prev, e)
    }
  }

  return () => {
    for (const restore of restores) restore()
  }
}

/**
 * Scale a 1× schedule PNG to export pixel density. iOS WebKit often drops embedded
 * images when html-to-image runs at pixelRatio 5 with large data-URL sources.
 */
export async function upscaleScheduleSharePngBlob(
  blob: Blob,
  pixelRatio: number,
): Promise<Blob> {
  if (pixelRatio <= 1) return blob

  const targetWidth = WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX * pixelRatio
  const targetHeight =
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX * pixelRatio

  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D unavailable")
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))),
        "image/png",
      )
    })
  } finally {
    bitmap.close()
  }
}

export async function captureScheduleShareNodeToBlob(
  node: HTMLElement,
  options: ScheduleShareCaptureOptions,
): Promise<Blob | null> {
  const assetsPreResolved =
    node.getAttribute("data-schedule-share-assets-resolved") === "1"

  if (assetsPreResolved) {
    await waitForScheduleShareCaptureImages(node, 3000)
  } else {
    await waitForScheduleShareCaptureReady(node)
    await waitForScheduleShareCaptureImages(node)
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const shouldInline =
    !assetsPreResolved &&
    (isScheduleShareCaptureIOSWebKit() ||
      Array.from(node.querySelectorAll("img")).some((img) =>
        img.src.startsWith("blob:"),
      ))

  const restore =
    shouldInline ? await inlineImagesForScheduleShareCapture(node) : () => {}

  const requestedPixelRatio = options.pixelRatio ?? 1
  /** Capture at 1× on iOS, then upscale — matches working mobile preview capture. */
  const useIosLowCapture =
    requestedPixelRatio > 1 && isScheduleShareCaptureIOSWebKit()
  const captureOptions: ScheduleShareCaptureOptions =
    useIosLowCapture ? { ...options, pixelRatio: 1 } : options

  try {
    const blob = await toBlob(node, captureOptions)
    if (!blob) return null
    if (!useIosLowCapture) return blob
    return upscaleScheduleSharePngBlob(blob, requestedPixelRatio)
  } finally {
    restore()
  }
}
