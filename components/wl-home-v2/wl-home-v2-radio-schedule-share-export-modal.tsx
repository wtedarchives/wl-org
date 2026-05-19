"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Copy, Download, UploadSimple } from "@phosphor-icons/react"
import { useAuth } from "@/components/auth-context"
import { WlHomeV2RadioScheduleShareExportCard } from "@/components/wl-home-v2/wl-home-v2-radio-schedule-share-export-card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRadioScheduleShareMobilePreview } from "@/hooks/use-radio-schedule-share-mobile-preview"
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
import {
  buildRadioScheduleShareExportDayOptions,
  isSameLocalCalendarDay,
  localCalendarDayKey,
  parseLocalCalendarDayKey,
  startOfLocalCalendarDay,
  type RadioScheduleShareExportDayOption,
} from "@/lib/wl-home-v2-radio-schedule-share-export-days"
import { downloadOrWebSharePng } from "@/lib/wl-home-v2-share-image-download"
import {
  radioScheduleShareStoragePath,
  uploadRadioScheduleSharePng,
} from "@/lib/radio-schedule-share-upload"
import {
  captureScheduleShareNodeToBlob,
  WL_SCHEDULE_SHARE_MOBILE_CAPTURE_LAYER_CLASS,
} from "@/lib/wl-schedule-share-capture"
import { cn } from "@/lib/utils"

const RADIO_SCHEDULE_SHARE_CAPTURE_OPTS = {
  /**
   * Must stay false when row artwork uses `blob:` URLs (proxied cross-origin images).
   * `cacheBust: true` appends `?…` to src for reloads; query suffix breaks blob URLs → capture fetch fails.
   */
  cacheBust: false,
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
  const isMobile = useIsMobile()
  const { session } = useAuth()
  /** Desktop-layout export card (visible on desktop; in-viewport capture layer on mobile). */
  const desktopCaptureRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | "copy" | "download" | "generate">(null)
  const [scheduleDay, setScheduleDay] = useState(() => startOfLocalCalendarDay())
  const [selectedDayKey, setSelectedDayKey] = useState(() =>
    localCalendarDayKey(startOfLocalCalendarDay()),
  )
  const [dayOptions, setDayOptions] = useState<
    RadioScheduleShareExportDayOption[]
  >(() => buildRadioScheduleShareExportDayOptions())
  const [slots, setSlots] = useState<RadioScheduleSlot[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const {
    previewUrl: mobilePreviewUrl,
    previewLoading: mobilePreviewLoading,
    clearPreview: clearMobilePreview,
  } = useRadioScheduleShareMobilePreview({
    enabled: open && isMobile,
    captureRef: desktopCaptureRef,
    scheduleLoading,
    slots,
    backgroundSrc,
    scheduleDay,
  })

  useEffect(() => {
    if (!open) {
      setNotice(null)
      setBusy(null)
      clearMobilePreview()
      return
    }
    const today = startOfLocalCalendarDay()
    setDayOptions(buildRadioScheduleShareExportDayOptions())
    setScheduleDay(today)
    setSelectedDayKey(localCalendarDayKey(today))
  }, [open, clearMobilePreview])

  useEffect(() => {
    if (!open) return
    setScheduleLoading(true)
    setLoadError(null)
    let cancelled = false
    const nowMs =
      isSameLocalCalendarDay(scheduleDay, new Date()) ? Date.now() : 0
    fetchRadioScheduleMergedSlotsForLocalDay(scheduleDay, nowMs).then(
      (result) => {
        if (cancelled) return
        setSlots(result.slots)
        setLoadError(result.error)
        setScheduleLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [open, scheduleDay])

  const captureDesktopSchedulePng = useCallback(async () => {
    const node = desktopCaptureRef.current
    if (!node) return null
    return captureScheduleShareNodeToBlob(node, RADIO_SCHEDULE_SHARE_CAPTURE_OPTS)
  }, [])

  const handleDownload = useCallback(async () => {
    const node = desktopCaptureRef.current
    if (!node) return
    setBusy("download")
    setNotice(null)
    try {
      const blob = await captureDesktopSchedulePng()
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
  }, [scheduleDay, captureDesktopSchedulePng])

  const handleGenerate = useCallback(async () => {
    if (!session?.token) {
      setNotice("Sign in to upload schedule images.")
      return
    }
    setBusy("generate")
    setNotice(null)
    try {
      const blob = await captureDesktopSchedulePng()
      if (!blob) {
        setNotice("Could not create image.")
        return
      }
      const filename = scheduleShareFilename(scheduleDay)
      const path = radioScheduleShareStoragePath(
        localCalendarDayKey(scheduleDay),
        filename,
      )
      const { publicUrl, error } = await uploadRadioScheduleSharePng(
        session.token,
        path,
        blob,
      )
      if (error) {
        setNotice(error)
        return
      }
      setNotice(
        publicUrl ?
          `Uploaded to radio-schedules: ${publicUrl}`
        : `Uploaded to radio-schedules (${path}).`,
      )
    } catch (e) {
      console.error(e)
      setNotice("Could not generate or upload image.")
    } finally {
      setBusy(null)
    }
  }, [captureDesktopSchedulePng, scheduleDay, session?.token])

  const handleCopy = useCallback(async () => {
    const node = desktopCaptureRef.current
    if (!node) return
    setBusy("copy")
    setNotice(null)
    try {
      const blob = await captureDesktopSchedulePng()
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
  }, [captureDesktopSchedulePng])

  const exportWidthPx =
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_WIDTH_PX *
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO
  const exportHeightPx =
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_HEIGHT_PX *
    WL_HOME_V2_RADIO_SCHEDULE_SHARE_EXPORT_PIXEL_RATIO

  const exportActionsDisabled =
    busy !== null ||
    scheduleLoading ||
    (isMobile && mobilePreviewLoading)

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
            only there). All shows on the selected day in your local timezone.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(62vh,680px)] w-full min-w-0 overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/25 p-2 sm:p-3">
          {isMobile ?
            <div className="flex min-h-[200px] w-full items-center justify-center">
              {scheduleLoading || mobilePreviewLoading ?
                <p className="text-center text-xs text-muted-foreground">
                  Building preview…
                </p>
              : mobilePreviewUrl ?
                // eslint-disable-next-line @next/next/no-img-element -- blob preview of captured PNG
                <img
                  src={mobilePreviewUrl}
                  alt={`WTED Radio schedule for ${dayOptions.find((o) => o.key === selectedDayKey)?.label ?? "selected day"}`}
                  className="mx-auto max-h-[min(58vh,640px)] w-auto max-w-full object-contain"
                />
              : <p className="text-center text-xs text-muted-foreground">
                  Preview unavailable. You can still download the image.
                </p>
              }
            </div>
          : <div className="flex w-full min-w-0 justify-center">
              <div className="inline-block w-min min-w-min shrink-0">
                <WlHomeV2RadioScheduleShareExportCard
                  ref={desktopCaptureRef}
                  backgroundSrc={backgroundSrc}
                  scheduleDay={scheduleDay}
                  slots={slots}
                  loading={scheduleLoading}
                  error={loadError}
                />
              </div>
            </div>
          }

          {isMobile ?
            <div
              className={WL_SCHEDULE_SHARE_MOBILE_CAPTURE_LAYER_CLASS}
              aria-hidden
            >
              <div className="inline-block w-min min-w-min shrink-0">
                <WlHomeV2RadioScheduleShareExportCard
                  ref={desktopCaptureRef}
                  backgroundSrc={backgroundSrc}
                  scheduleDay={scheduleDay}
                  slots={slots}
                  loading={scheduleLoading}
                  error={loadError}
                />
              </div>
            </div>
          : null}
        </div>

        {notice ?
          <p className="text-center text-xs text-muted-foreground">{notice}</p>
        : null}

        <DialogFooter className="w-full flex-row flex-wrap items-center justify-center gap-2">
          <Select
            value={selectedDayKey}
            disabled={exportActionsDisabled}
            onValueChange={(key) => {
              setSelectedDayKey(key)
              setScheduleDay(parseLocalCalendarDayKey(key))
            }}
          >
            <SelectTrigger size="sm" className="min-w-[6.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isMobile ?
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={exportActionsDisabled}
              onClick={handleCopy}
            >
              <Copy className="size-3.5" aria-hidden />
              Copy image
            </Button>
          : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={exportActionsDisabled}
            onClick={handleGenerate}
          >
            <UploadSimple className="size-3.5" aria-hidden />
            Generate
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={exportActionsDisabled}
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
