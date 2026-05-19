"use client"

import { toBlob } from "html-to-image"
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react"

import { withShareCaptureImagesInlined } from "@/lib/wl-home-v2-share-capture-inline-images"

type HtmlToImageOptions = NonNullable<Parameters<typeof toBlob>[1]>

/**
 * On narrow viewports (`isMobile`), generates a PNG blob once per `captureSignature`
 * and exposes an object URL for preview. Desktop uses live HTML instead.
 */
export function useSharePngMobilePreview(opts: {
  open: boolean
  isMobile: boolean
  captureRef: RefObject<HTMLElement | null>
  /** When false, we wait (e.g. schedule still loading). */
  readyToCapture: boolean
  /** Change when underlying card content changes (regenerates preview). */
  captureSignature: string
  toBlobOptions: HtmlToImageOptions
  logPrefix: string
}) {
  const {
    open,
    isMobile,
    captureRef,
    readyToCapture,
    captureSignature,
    toBlobOptions,
    logPrefix,
  } = opts

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const blobRef = useRef<Blob | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  /** Keep latest options / prefix without enlarging/shifting effect deps across renders / HMR. */
  const toBlobOptionsRef = useRef(toBlobOptions)
  const logPrefixRef = useRef(logPrefix)
  toBlobOptionsRef.current = toBlobOptions
  logPrefixRef.current = logPrefix

  useEffect(() => {
    if (!open || !isMobile) {
      blobRef.current = null
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setPreviewUrl(null)
      setGenerating(false)
      return
    }

    if (!readyToCapture) {
      blobRef.current = null
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setPreviewUrl(null)
      setGenerating(false)
      return
    }

    let cancelled = false

    blobRef.current = null
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPreviewUrl(null)
    setGenerating(true)

    const run = async () => {
      try {
        try {
          await document.fonts?.ready?.catch(() => undefined)
        } catch {
          /* ignore */
        }

        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        await new Promise<void>((r) => requestAnimationFrame(() => r()))

        const node = captureRef.current
        if (cancelled || !node) return

        try {
          const blob = await withShareCaptureImagesInlined(
            node,
            logPrefixRef.current,
            () => toBlob(node, toBlobOptionsRef.current),
          )
          if (cancelled || !blob) return
          const url = URL.createObjectURL(blob)
          objectUrlRef.current = url
          blobRef.current = blob
          setPreviewUrl(url)
        } catch (e) {
          console.error(`${logPrefixRef.current} mobile preview raster failed`, e)
          if (!cancelled) {
            blobRef.current = null
            setPreviewUrl(null)
          }
        }
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- captureRef stable; read `.current` when rasterizing
  }, [
    open,
    isMobile,
    readyToCapture,
    captureSignature,
  ])

  return {
    previewUrl,
    generating,
    /** Same blob backing `previewUrl` — reuse for Copy/Download on mobile. */
    cachedRasterBlobRef: blobRef,
    hasRenderablePreview: Boolean(previewUrl),
  }
}
