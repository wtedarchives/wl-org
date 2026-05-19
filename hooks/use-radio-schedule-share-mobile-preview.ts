"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { captureScheduleShareNodeToBlob } from "@/lib/wl-schedule-share-capture"

const PREVIEW_CAPTURE_OPTS = {
  cacheBust: false,
  pixelRatio: 1,
  backgroundColor: "rgba(0, 0, 0, 0)",
} as const

/** One delayed recapture for proxied row artwork that resolves after the first pass. */
const PREVIEW_FOLLOW_UP_CAPTURE_MS = 750

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
  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

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
    let captureGeneration = 0

    const runCapture = async (showLoading: boolean) => {
      const node = captureRef.current
      if (!node || cancelled) return

      const generation = ++captureGeneration
      if (showLoading) setPreviewLoading(true)

      try {
        const blob = await captureScheduleShareNodeToBlob(
          node,
          PREVIEW_CAPTURE_OPTS,
        )
        if (cancelled || generation !== captureGeneration || !blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      } catch (e) {
        console.error(e)
        if (!cancelled && generation === captureGeneration) {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
        }
      } finally {
        if (!cancelled && generation === captureGeneration) {
          setPreviewLoading(false)
        }
      }
    }

    const waitForNode = () =>
      new Promise<HTMLDivElement | null>((resolve) => {
        const tryResolve = () => {
          const node = captureRef.current
          if (node) resolve(node)
          else if (!cancelled) requestAnimationFrame(tryResolve)
          else resolve(null)
        }
        tryResolve()
      })

    void (async () => {
      const node = await waitForNode()
      if (!node || cancelled) return
      await runCapture(!previewUrlRef.current)
    })()

    const followUpTimer = setTimeout(() => {
      void runCapture(false)
    }, PREVIEW_FOLLOW_UP_CAPTURE_MS)

    return () => {
      cancelled = true
      captureGeneration += 1
      clearTimeout(followUpTimer)
    }
  }, [enabled, scheduleLoading, slots, backgroundSrc, scheduleDay, captureRef])

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
