"use client"

import { useCallback, useEffect, useState, type RefObject } from "react"
import { toBlob } from "html-to-image"

const PREVIEW_CAPTURE_OPTS = {
  cacheBust: false,
  pixelRatio: 1,
  backgroundColor: "rgba(0, 0, 0, 0)",
} as const

async function waitForCaptureImages(
  root: HTMLElement,
  timeoutMs = 5000,
): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"))
  if (imgs.length === 0) return
  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          img.complete ?
            Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true })
              img.addEventListener("error", () => resolve(), { once: true })
            }),
      ),
    ),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs)
    }),
  ])
}

export function useRadioScheduleShareMobilePreview({
  enabled,
  captureRef,
  scheduleLoading,
  slots,
  backgroundSrc,
  scheduleDay,
}: {
  enabled: boolean
  captureRef: RefObject<HTMLDivElement | null>
  scheduleLoading: boolean
  slots: unknown[]
  backgroundSrc: string
  scheduleDay: Date
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setPreviewLoading(false)
      return
    }

    if (scheduleLoading) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setPreviewLoading(false)
      return
    }

    let cancelled = false
    let debounceTimer: ReturnType<typeof setTimeout> | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let observer: MutationObserver | undefined

    const capturePreview = async () => {
      const node = captureRef.current
      if (!node || cancelled) return
      setPreviewLoading(true)
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (cancelled) return
      await waitForCaptureImages(node)
      if (cancelled) return
      try {
        const blob = await toBlob(node, PREVIEW_CAPTURE_OPTS)
        if (cancelled || !blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
        }
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }

    const scheduleCapture = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        void capturePreview()
      }, 200)
    }

    const attachObserver = () => {
      const node = captureRef.current
      if (!node) {
        retryTimer = setTimeout(attachObserver, 50)
        return
      }
      scheduleCapture()
      observer = new MutationObserver(scheduleCapture)
      observer.observe(node, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src"],
      })
    }

    attachObserver()

    return () => {
      cancelled = true
      if (debounceTimer) clearTimeout(debounceTimer)
      if (retryTimer) clearTimeout(retryTimer)
      observer?.disconnect()
    }
  }, [
    enabled,
    scheduleLoading,
    slots,
    backgroundSrc,
    scheduleDay,
    captureRef,
  ])

  useEffect(() => {
    return () => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  const clearPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPreviewLoading(false)
  }, [])

  return { previewUrl, previewLoading, clearPreview }
}
