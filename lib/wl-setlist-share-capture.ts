import { toJpeg } from "html-to-image"

/**
 * Setlist share capture for Bluesky / Instagram (admin brain button).
 *
 * html-to-image rasterizes via SVG foreignObject. On iOS Safari that path
 * drops <img> pixels when the node is off-screen, uses CSS object-fit/filter,
 * cacheBust (re-fetch mid-capture), or pixelRatio > 1. Desktop Chrome is fine;
 * phones are not. This module bakes images into data URLs and captures on-screen
 * at 1×, then upscales.
 */

export const SETLIST_SHARE_CAPTURE_LIVE_CLASS =
  "wl-setlist-share-capture--live"

const CAPTURE_BACKGROUND = "#000000"

export function isSetlistShareCaptureIOSWebKit(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
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

async function fetchToDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src
  const url = new URL(src, window.location.origin).href
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${src} (${res.status})`)
  return blobToDataUrl(await res.blob())
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image failed to load"))
    img.src = src
  })
}

async function waitDoubleRaf(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function drawFitted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dw: number,
  dh: number,
  fit: "cover" | "contain" | "fill",
): void {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return
  if (fit === "fill") {
    ctx.drawImage(img, 0, 0, dw, dh)
    return
  }
  const scale =
    fit === "cover" ? Math.max(dw / iw, dh / ih) : Math.min(dw / iw, dh / ih)
  const rw = iw * scale
  const rh = ih * scale
  const rx = (dw - rw) / 2
  const ry = (dh - rh) / 2
  if (fit === "cover") {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, dw, dh)
    ctx.clip()
    ctx.drawImage(img, rx, ry, rw, rh)
    ctx.restore()
    return
  }
  ctx.drawImage(img, rx, ry, rw, rh)
}

function objectFitMode(value: string): "cover" | "contain" | "fill" {
  if (value === "cover" || value === "contain") return value
  return "fill"
}

/**
 * Replace each <img> with a same-size data URL that already has object-fit and
 * CSS filter baked in, so Safari's foreignObject only has to stretch pixels.
 */
export async function bakeSetlistShareImages(
  root: HTMLElement,
): Promise<() => void> {
  const restores: Array<() => void> = []
  const imgs = Array.from(root.querySelectorAll("img"))

  for (const img of imgs) {
    const prevSrc = img.getAttribute("src")
    if (!prevSrc) continue
    const prevCrossOrigin = img.getAttribute("crossorigin")
    const prevObjectFit = img.style.objectFit
    const prevFilter = img.style.filter

    restores.push(() => {
      img.setAttribute("src", prevSrc)
      if (prevCrossOrigin) img.setAttribute("crossorigin", prevCrossOrigin)
      else img.removeAttribute("crossorigin")
      img.style.removeProperty("object-fit")
      img.style.removeProperty("filter")
      if (prevObjectFit) img.style.objectFit = prevObjectFit
      if (prevFilter) img.style.filter = prevFilter
    })

    try {
      const computed = getComputedStyle(img)
      const dataUrl = await fetchToDataUrl(img.currentSrc || prevSrc)
      const source = await loadHtmlImage(dataUrl)
      await source.decode().catch(() => undefined)

      const destW = Math.max(
        1,
        Math.round(img.clientWidth || img.offsetWidth) || source.naturalWidth,
      )
      const destH = Math.max(
        1,
        Math.round(img.clientHeight || img.offsetHeight) || source.naturalHeight,
      )
      const canvas = document.createElement("canvas")
      canvas.width = destW
      canvas.height = destH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas 2D unavailable")
      const cssFilter = computed.filter
      if (cssFilter && cssFilter !== "none") ctx.filter = cssFilter
      drawFitted(ctx, source, destW, destH, objectFitMode(computed.objectFit))
      ctx.filter = "none"

      const opaque = cssFilter.includes("grayscale") || cssFilter.includes("brightness")
      const baked = opaque ?
        canvas.toDataURL("image/jpeg", 0.92)
      : canvas.toDataURL("image/png")

      img.removeAttribute("crossorigin")
      img.style.setProperty("object-fit", "fill", "important")
      img.style.setProperty("filter", "none", "important")
      img.src = baked
      await img.decode().catch(() => undefined)
    } catch (e) {
      console.warn("setlist share capture: could not bake image", prevSrc, e)
    }
  }

  return () => {
    for (const restore of restores) restore()
  }
}

export async function withSetlistShareCaptureLive<T>(
  layer: HTMLElement,
  run: () => Promise<T>,
): Promise<T> {
  layer.classList.add(SETLIST_SHARE_CAPTURE_LIVE_CLASS)
  try {
    await waitDoubleRaf()
    return await run()
  } finally {
    layer.classList.remove(SETLIST_SHARE_CAPTURE_LIVE_CLASS)
  }
}

async function upscaleJpegDataUrl(
  dataUrl: string,
  factor: number,
  quality: number,
): Promise<string> {
  if (factor <= 1) return dataUrl
  const img = await loadHtmlImage(dataUrl)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(img.naturalWidth * factor))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * factor))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D unavailable")
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", quality)
}

export function base64FromDataUrl(dataUrl: string): string | null {
  const comma = dataUrl.indexOf(",")
  if (comma < 0) return null
  const payload = dataUrl.slice(comma + 1)
  return payload.trim() ? payload : null
}

export function decodedByteLength(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

export async function rasteriseSetlistShareNode(
  node: HTMLElement,
  steps: ReadonlyArray<{ pixelRatio: number; quality: number }>,
  maxBytes: number,
  label: string,
): Promise<string | null> {
  const lowRatio = isSetlistShareCaptureIOSWebKit()
  for (const step of steps) {
    const dataUrl = await toJpeg(node, {
      cacheBust: false,
      pixelRatio: lowRatio ? 1 : step.pixelRatio,
      quality: step.quality,
      backgroundColor: CAPTURE_BACKGROUND,
    })
    if (!dataUrl) continue
    const scaled =
      lowRatio && step.pixelRatio > 1 ?
        await upscaleJpegDataUrl(dataUrl, step.pixelRatio, step.quality)
      : dataUrl
    const base64 = base64FromDataUrl(scaled)
    if (!base64) continue
    if (decodedByteLength(base64) <= maxBytes) return base64
  }
  console.error(`${label}: every quality step exceeded the size budget`)
  return null
}

/** Letterbox the captured card onto a fixed 4:5 JPEG for Instagram. */
export async function letterboxSetlistShareJpegForInstagram(
  cardBase64: string,
  backgroundSrc: string,
  canvasWidthPx: number,
  canvasHeightPx: number,
  paddingPx: number,
  pixelRatio: number,
  quality: number,
): Promise<string | null> {
  const [bg, card] = await Promise.all([
    fetchToDataUrl(backgroundSrc).then(loadHtmlImage),
    loadHtmlImage(`data:image/jpeg;base64,${cardBase64}`),
  ])
  const w = Math.round(canvasWidthPx * pixelRatio)
  const h = Math.round(canvasHeightPx * pixelRatio)
  const pad = paddingPx * pixelRatio
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.fillStyle = CAPTURE_BACKGROUND
  ctx.fillRect(0, 0, w, h)
  drawFitted(ctx, bg, w, h, "cover")

  const availW = w - pad * 2
  const availH = h - pad * 2
  const scale = Math.min(availW / card.naturalWidth, availH / card.naturalHeight)
  const dw = card.naturalWidth * scale
  const dh = card.naturalHeight * scale
  ctx.drawImage(card, (w - dw) / 2, (h - dh) / 2, dw, dh)

  return base64FromDataUrl(canvas.toDataURL("image/jpeg", quality))
}
