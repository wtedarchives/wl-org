/**
 * Helpers for PNG share capture via `html-to-image`.
 *
 * Mobile Safari WebKit frequently drops remote raster URLs during the library's
 * internal `fetch(+ cacheBust)`, while SVG/text paint fine — thumbnails and bg go blank.
 * Inlining `<img>` sources as data URLs beforehand makes clones hit `isDataUrl` paths and
 * skip those fetches. See embed-images in html-to-image.
 */

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("FileReader"))
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Unexpected FileReader result"))
    }
    reader.readAsDataURL(blob)
  })
}

async function fetchImageAsDataUrl(absoluteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(absoluteUrl, {
      mode: "cors",
      credentials: "omit",
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return await blobToDataUrl(blob)
  } catch {
    return null
  }
}

type MutatedRasterImg = {
  el: HTMLImageElement
  srcAttr: string
  crossOriginAttr: string | null
}

async function mutateOneImg(
  el: HTMLImageElement,
  mutated: MutatedRasterImg[],
  logPrefix: string,
): Promise<void> {
  const srcRaw = el.getAttribute("src")?.trim()
  if (!srcRaw?.length || srcRaw.startsWith("data:")) return

  let absolute: string
  try {
    absolute = new URL(srcRaw, window.location.href).href
  } catch {
    return
  }

  const dataUrl = await fetchImageAsDataUrl(absolute)
  if (!dataUrl) {
    console.warn(
      `${logPrefix} could not inline image (capture may omit art on Mobile Safari):`,
      absolute.slice(0, 120),
    )
    return
  }

  mutated.push({
    el,
    srcAttr: srcRaw,
    crossOriginAttr: el.getAttribute("crossorigin"),
  })

  el.removeAttribute("crossorigin")
  el.src = dataUrl
  try {
    if (typeof el.decode === "function") await el.decode()
  } catch {
    await new Promise<void>((resolve) => {
      if (el.complete && el.naturalHeight > 0) {
        resolve()
        return
      }
      el.addEventListener("load", () => resolve(), { once: true })
      el.addEventListener("error", () => resolve(), { once: true })
    })
  }
}

/**
 * Temporarily swaps raster `<img src>` under `captureRoot` to data URLs so
 * `html-to-image` skips its own network fetches during `toBlob` / `toPng`.
 * Restores originals after capture (success or failure).
 */
export async function withShareCaptureImagesInlined<T>(
  captureRoot: HTMLElement | null | undefined,
  logPrefix: string,
  capture: () => Promise<T>,
): Promise<T> {
  if (!captureRoot) return capture()

  const imgs = [...captureRoot.querySelectorAll<HTMLImageElement>("img[src]")]
  const mutated: MutatedRasterImg[] = []

  try {
    for (const el of imgs) {
      await mutateOneImg(el, mutated, logPrefix)
    }

    return await capture()
  } finally {
    for (let i = mutated.length - 1; i >= 0; i--) {
      const m = mutated[i]!
      m.el.src = ""
      m.el.setAttribute("src", m.srcAttr)
      if (m.crossOriginAttr != null) {
        m.el.setAttribute("crossorigin", m.crossOriginAttr)
      } else {
        m.el.removeAttribute("crossorigin")
      }
    }
  }
}
