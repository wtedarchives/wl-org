"use client"

import { useEffect, useState } from "react"

import {
  getScheduleShareProxiedBlobUrl,
  scheduleShareExportImageNeedsProxy,
} from "@/lib/wl-schedule-share-proxy-image"

/**
 * Loads schedule-row artwork via Edge proxy when cross-origin (canvas-safe blob URL on mobile Safari).
 */
export function WlScheduleShareProxiedArtworkImg({
  originalHref,
  imgClassName,
}: {
  originalHref: string
  imgClassName: string
}) {
  const needsProxy = scheduleShareExportImageNeedsProxy(originalHref)
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() =>
    needsProxy ? null : originalHref.trim(),
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const trimmed = originalHref.trim()
    if (!trimmed) {
      setResolvedSrc(null)
      setFailed(true)
      return
    }

    if (!scheduleShareExportImageNeedsProxy(originalHref)) {
      setResolvedSrc(trimmed)
      setFailed(false)
      return
    }

    setResolvedSrc(null)
    setFailed(false)

    getScheduleShareProxiedBlobUrl(originalHref)
      .then((url) => {
        if (!cancelled) setResolvedSrc(url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [originalHref])

  const loadingProxy =
    scheduleShareExportImageNeedsProxy(originalHref) &&
    !resolvedSrc &&
    !failed

  if (!originalHref.trim() || failed || loadingProxy) {
    return (
      <div
        className="wl-radio-schedule-share-export__row-art-placeholder"
        aria-hidden
      />
    )
  }

  const blobImage = resolvedSrc?.startsWith("blob:") ?? false

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- PNG capture */}
      <img
        src={resolvedSrc ?? ""}
        alt=""
        draggable={false}
        className={imgClassName}
        {...(blobImage ? {} : { crossOrigin: "anonymous" as const })}
      />
    </>
  )
}
