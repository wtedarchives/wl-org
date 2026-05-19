"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Copy, Download } from "@phosphor-icons/react"
import { toBlob } from "html-to-image"

import { WlHomeV2RadioScheduleShareExportCard } from "@/components/wl-home-v2/wl-home-v2-radio-schedule-share-export-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  fetchRadioScheduleMergedSlotsForLocalDay,
  type RadioScheduleSlot,
} from "@/hooks/use-radio-schedule"
import {
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX,
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_CLEAR_BAND_PX,
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_REF_HEIGHT_PX,
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO,
  WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX,
} from "@/lib/wl-home-v2-radio-schedule-share-export-config"
import { downloadOrWebSharePng } from "@/lib/wl-home-v2-share-image-download"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSharePngMobilePreview } from "@/hooks/use-share-png-mobile-preview"
import { withShareCaptureImagesInlined } from "@/lib/wl-home-v2-share-capture-inline-images"
import { cn } from "@/lib/utils"

const RADIO_SCHEDULE_SHARE_CAPTURE_OPTS = {
  cacheBust: true,
  pixelRatio: WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO,
  backgroundColor: "rgba(0, 0, 0, 0)",
} as const

function scheduleShareFilename(day: Date): string {
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, "0")
  const d = String(day.getDate()).padStart(2, "0")
  return `wted-schedule-${y}-${m}-${d}.png`
}

export function WlHomeV2RadioScheduleShareExportModal({
  open,
  onOpenChange,
  backgroundSrc,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  backgroundSrc: string
}) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | "copy" | "download">(null)
  const [scheduleDay, setScheduleDay] = useState(() => new Date())
  const [slots, setSlots] = useState<RadioScheduleSlot[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const isMobile = useIsMobile()

  const scheduleCaptureSignature = useMemo(() => {
    const slotSig = slots
      .map(
        (s) =>
          `${s.event.event_id}|${s.event.start}|${s.event.playlist.name}|${s.wtedEpisode?.display_name ?? ""}`,
      )
      .join("~")
    return `${scheduleDay.getTime()}|${backgroundSrc}|${loadError ?? ""}|${slotSig}`
  }, [scheduleDay, backgroundSrc, loadError, slots])

  const readyToCaptureSchedule = !scheduleLoading

  const {
    previewUrl: mobilePreviewUrl,
    generating: mobilePreviewGenerating,
    cachedRasterBlobRef: scheduleMobileRasterRef,
  } = useSharePngMobilePreview({
    open,
    isMobile,
    captureRef,
    readyToCapture: readyToCaptureSchedule,
    captureSignature: scheduleCaptureSignature,
    toBlobOptions: RADIO_SCHEDULE_SHARE_CAPTURE_OPTS,
    logPrefix: "[radio schedule share png]",
  })

  useEffect(() => {
    if (!open) {
      setNotice(null)
      setBusy(null)
      return
    }
    const day = new Date()
    setScheduleDay(day)
    setScheduleLoading(true)
    setLoadError(null)
    let cancelled = false
    fetchRadioScheduleMergedSlotsForLocalDay(day).then((result) => {
      if (cancelled) return
      setSlots(result.slots)
      setLoadError(result.error)
      setScheduleLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const captureScheduleBlob = useCallback(async () => {
    const node = captureRef.current
    if (!node) return null
    if (isMobile) {
      const cached = scheduleMobileRasterRef.current
      if (cached) return cached
    }
    return withShareCaptureImagesInlined(
      node,
      "[radio schedule share png]",
      () => toBlob(node, RADIO_SCHEDULE_SHARE_CAPTURE_OPTS),
    )
  }, [isMobile, scheduleMobileRasterRef])

  const handleDownload = useCallback(async () => {
    const node = captureRef.current
    if (!node) return
    setBusy("download")
    setNotice(null)
    try {
      const blob = await captureScheduleBlob()
      if (!blob) {
        setNotice("Could not create image.")
        return
      }
      const name = scheduleShareFilename(scheduleDay)
      const how = await downloadOrWebSharePng(blob, name, {
        shareTitle: "WTED Radio schedule",
      })
      setNotice(
        how === "shared" ?
          "Share sheet opened — tap Save Image to add to Photos (or share elsewhere)."
        : "Download started.",
      )
    } catch (e) {
      console.error(e)
      setNotice("Could not create image. Try again.")
    } finally {
      setBusy(null)
    }
  }, [captureScheduleBlob, scheduleDay])

  const handleCopy = useCallback(async () => {
    const node = captureRef.current
    if (!node) return
    setBusy("copy")
    setNotice(null)
    try {
      const blob = await captureScheduleBlob()
      if (!blob) {
        setNotice("Could not create image.")
        return
      }
      if (!navigator.clipboard?.write) {
        setNotice("Clipboard copy is not supported in this browser.")
        return
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
      setNotice("Copied image to clipboard.")
    } catch (e) {
      console.error(e)
      setNotice(
        "Copy failed (browser may block clipboard images). Use Download.",
      )
    } finally {
      setBusy(null)
    }
  }, [captureScheduleBlob])

  const mobileActionDisabled =
    busy !== null ||
    (isMobile && (scheduleLoading || mobilePreviewGenerating))

  const exportWidthPx =
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX *
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO
  const exportHeightPx =
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX *
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92vh,900px)] w-full max-w-[min(600px,calc(100vw-2rem))] flex-col gap-3 overflow-hidden p-4 sm:p-5",
          /* DialogContent ships `sm:max-w-sm` (384px); override so this modal can reach 600px wide. */
          "sm:max-w-[min(600px,calc(100vw-2rem))]",
        )}
      >
        <DialogHeader className="w-full max-w-full gap-1 text-left">
          <DialogTitle className="text-base">Schedule image</DialogTitle>
          <DialogDescription className="text-xs">
            Preview{" "}
            {WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX}×
            {WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX}px (9∶16). Export{" "}
            {WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO}× ({exportWidthPx}×
            {exportHeightPx}px). Top and bottom margins keep UI out of Instagram
            Story safe bands (first and last {WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_CLEAR_BAND_PX}
            px at {WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_IG_REF_HEIGHT_PX}px height—background
            only there). All shows starting today in your local timezone.
          </DialogDescription>
        </DialogHeader>

        {isMobile ?
          <div className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/25 p-3">
            {scheduleLoading ?
              <p className="text-center text-xs text-muted-foreground">
                Loading schedule…
              </p>
            : null}
            {!scheduleLoading && mobilePreviewGenerating ?
              <p className="text-center text-xs text-muted-foreground">
                Rendering image preview…
              </p>
            : null}
            {!scheduleLoading && mobilePreviewUrl ?
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview of rasterized export */}
                <img
                  src={mobilePreviewUrl}
                  alt="WTED Radio schedule — same image as download"
                  className="mx-auto max-h-[min(62vh,680px)] w-full max-w-full object-contain"
                  draggable={false}
                />
              </>
            : null}
            {!scheduleLoading &&
            !mobilePreviewGenerating &&
            !mobilePreviewUrl &&
            !loadError ?
              <p className="text-center text-xs text-muted-foreground">
                Could not build preview. Try Download PNG.
              </p>
            : null}
            {loadError ?
              <p className="text-center text-xs text-destructive">{loadError}</p>
            : null}
          </div>
        : <div className="max-h-[min(62vh,680px)] w-full min-w-0 overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/25 p-2 sm:p-3">
            <div className="flex w-full min-w-0 justify-center">
              <div className="inline-block w-min min-w-min shrink-0">
                <WlHomeV2RadioScheduleShareExportCard
                  ref={captureRef}
                  backgroundSrc={backgroundSrc}
                  scheduleDay={scheduleDay}
                  slots={slots}
                  loading={scheduleLoading}
                  error={loadError}
                />
              </div>
            </div>
          </div>
        }

        {isMobile ?
          <div
            className="pointer-events-none fixed top-0 left-[-12000px] z-0 opacity-100"
            aria-hidden
          >
            <div className="inline-block w-min min-w-min shrink-0">
              <WlHomeV2RadioScheduleShareExportCard
                ref={captureRef}
                backgroundSrc={backgroundSrc}
                scheduleDay={scheduleDay}
                slots={slots}
                loading={scheduleLoading}
                error={loadError}
              />
            </div>
          </div>
        : null}

        {notice ?
          <p className="text-center text-xs text-muted-foreground">{notice}</p>
        : null}

        <DialogFooter className="w-full flex-row flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={mobileActionDisabled}
            onClick={handleCopy}
          >
            <Copy className="size-3.5" aria-hidden />
            Copy image
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={mobileActionDisabled}
            onClick={handleDownload}
          >
            <Download className="size-3.5" aria-hidden />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
