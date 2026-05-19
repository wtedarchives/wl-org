"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { captureScheduleShareNodeToBlob } from "@/lib/wl-schedule-share-capture"

const PREVIEW_CAPTURE_OPTS = {
  cacheBust: false,
  pixelRatio: 1,
  backgroundColor: "rgba(0, 0, 0, 0)",
} as const

const CAPTURE_DEBOUNCE_MS = 200
/** Backup recapture if artwork settles without a child-list mutation. */
const PREVIEW_FOLLOW_UP_CAPTURE_MS = 1000

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
    let debounceTimer: ReturnType<typeof setTimeout> | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let followUpTimer: ReturnType<typeof setTimeout> | undefined
    let observer: MutationObserver | undefined
    let isCapturing = false

    const runCapture = async (showLoading: boolean) => {
      const node = captureRef.current
      if (!node || cancelled || isCapturing) return

      const generation = ++captureGeneration
      isCapturing = true
      observer?.disconnect()

      if (showLoading && !previewUrlRef.current) setPreviewLoading(true)

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
        isCapturing = false
        if (!cancelled && generation === captureGeneration) {
          setPreviewLoading(false)
        }
        if (!cancelled && observer && captureRef.current) {
          observer.observe(captureRef.current, {
            childList: true,
            subtree: true,
          })
        }
      }
    }

    const scheduleCapture = () => {
      if (isCapturing || cancelled) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        void runCapture(!previewUrlRef.current)
      }, CAPTURE_DEBOUNCE_MS)
    }

    const attachObserver = () => {
      const node = captureRef.current
      if (!node) {
        retryTimer = setTimeout(attachObserver, 50)
        return
      }

      scheduleCapture()

      // childList only: proxied art swaps placeholder → <img>. Do not watch `src` —
      // capture inlines/restores src and would retrigger forever.
      observer = new MutationObserver(scheduleCapture)
      observer.observe(node, {
        childList: true,
        subtree: true,
      })

      followUpTimer = setTimeout(() => {
        scheduleCapture()
      }, PREVIEW_FOLLOW_UP_CAPTURE_MS)
    }

    attachObserver()

    return () => {
      cancelled = true
      captureGeneration += 1
      if (debounceTimer) clearTimeout(debounceTimer)
      if (retryTimer) clearTimeout(retryTimer)
      if (followUpTimer) clearTimeout(followUpTimer)
      observer?.disconnect()
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
