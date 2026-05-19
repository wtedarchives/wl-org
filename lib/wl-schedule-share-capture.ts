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

async function scheduleShareDoubleRaf(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
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

async function upscaleScheduleSharePngBlobByFactor(
  blob: Blob,
  factor: number,
): Promise<Blob> {
  if (factor <= 1) return blob

  const bitmap = await createImageBitmap(blob)
  try {
    const targetWidth = Math.round(bitmap.width * factor)
    const targetHeight = Math.round(bitmap.height * factor)
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

/**
 * Scale a schedule PNG to export pixel density (single step).
 * Prefer {@link upscaleScheduleSharePngBlobProgressive} on iOS fallbacks.
 */
export async function upscaleScheduleSharePngBlob(
  blob: Blob,
  pixelRatio: number,
): Promise<Blob> {
  return upscaleScheduleSharePngBlobByFactor(blob, pixelRatio)
}

/** 1× → 2× → … → target for slightly sharper upscales than one 5× jump. */
export async function upscaleScheduleSharePngBlobProgressive(
  blob: Blob,
  targetPixelRatio: number,
): Promise<Blob> {
  let current = blob
  let currentRatio = 1
  while (currentRatio < targetPixelRatio) {
    const nextRatio = Math.min(currentRatio * 2, targetPixelRatio)
    const step = nextRatio / currentRatio
    current = await upscaleScheduleSharePngBlobByFactor(current, step)
    currentRatio = nextRatio
  }
  return current
}

/**
 * iOS: html-to-image at pixelRatio 5 drops data-URL images, but 1× capture works.
 * Scale the live DOM with CSS, capture at 1× into a 5×-sized canvas (sharp + images).
 */
async function captureScheduleShareNodeWithCssScale(
  node: HTMLElement,
  scale: number,
  options: ScheduleShareCaptureOptions,
): Promise<Blob | null> {
  const outW = WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX * scale
  const outH = WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX * scale

  const wrapper = document.createElement("div")
  wrapper.className = WL_SCHEDULE_SHARE_MOBILE_CAPTURE_LAYER_CLASS
  wrapper.style.width = `${outW}px`
  wrapper.style.height = `${outH}px`
  wrapper.style.overflow = "hidden"

  const scaler = document.createElement("div")
  scaler.style.width = `${WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX}px`
  scaler.style.height = `${WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX}px`
  scaler.style.transform = `scale(${scale})`
  scaler.style.transformOrigin = "top left"

  const parent = node.parentElement
  const nextSibling = node.nextSibling
  scaler.appendChild(node)
  wrapper.appendChild(scaler)
  document.body.appendChild(wrapper)

  try {
    await waitForScheduleShareCaptureImages(node, 5000)
    await scheduleShareDoubleRaf()
    return await toBlob(wrapper, {
      ...options,
      pixelRatio: 1,
      width: outW,
      height: outH,
    })
  } finally {
    if (parent) {
      if (nextSibling) parent.insertBefore(node, nextSibling)
      else parent.appendChild(node)
    }
    wrapper.remove()
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

  await scheduleShareDoubleRaf()

  const shouldInline =
    !assetsPreResolved &&
    (isScheduleShareCaptureIOSWebKit() ||
      Array.from(node.querySelectorAll("img")).some((img) =>
        img.src.startsWith("blob:"),
      ))

  const restore =
    shouldInline ? await inlineImagesForScheduleShareCapture(node) : () => {}

  const requestedPixelRatio = options.pixelRatio ?? 1
  const useIosHiresPath =
    assetsPreResolved &&
    requestedPixelRatio > 1 &&
    isScheduleShareCaptureIOSWebKit()

  const useIosLowCapture =
    !assetsPreResolved &&
    requestedPixelRatio > 1 &&
    isScheduleShareCaptureIOSWebKit()

  try {
    if (useIosHiresPath) {
      try {
        const scaled = await captureScheduleShareNodeWithCssScale(
          node,
          requestedPixelRatio,
          options,
        )
        if (scaled) return scaled
      } catch (e) {
        console.warn(
          "Schedule share: CSS scale capture failed; using 1× + upscale",
          e,
        )
      }

      const lowBlob = await toBlob(node, { ...options, pixelRatio: 1 })
      if (!lowBlob) return null
      return upscaleScheduleSharePngBlobProgressive(
        lowBlob,
        requestedPixelRatio,
      )
    }

    const captureOptions: ScheduleShareCaptureOptions =
      useIosLowCapture ? { ...options, pixelRatio: 1 } : options

    const blob = await toBlob(node, captureOptions)
    if (!blob) return null
    if (!useIosLowCapture) return blob
    return upscaleScheduleSharePngBlobProgressive(blob, requestedPixelRatio)
  } finally {
    restore()
  }
}
