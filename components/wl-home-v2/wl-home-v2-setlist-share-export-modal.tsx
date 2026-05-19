"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Copy, Download } from "@phosphor-icons/react"
import { toBlob } from "html-to-image"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import type { SetlistEntry, Show } from "@/types/setlist"

import { WlHomeV2SetlistShareExportCard } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card"
import {
  WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO,
  WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX,
} from "@/lib/wl-home-v2-setlist-share-export-config"
import { downloadOrWebSharePng } from "@/lib/wl-home-v2-share-image-download"
import { withShareCaptureImagesInlined } from "@/lib/wl-home-v2-share-capture-inline-images"

const SETLIST_SHARE_CAPTURE_OPTS = {
  cacheBust: true,
  pixelRatio: WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO,
  /** Fully transparent canvas outside painted pixels (rounded corners stay crisp). */
  backgroundColor: "rgba(0, 0, 0, 0)",
} as const

function shareFilename(show: Show): string {
  const d = formatSetlistDate(show.show_date).replace(/\./g, "-")
  const idPart = show.show_id.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 12)
  return `setlist-${d}-${idPart}.png`
}

export function WlHomeV2SetlistShareExportModal({
  open,
  onOpenChange,
  backgroundSrc,
  show,
  setlist,
  showPositionInTour,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  backgroundSrc: string
  show: Show
  setlist: SetlistEntry[]
  showPositionInTour: ShowPositionInTour | null
}) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | "copy" | "download">(null)
  const [showEntryCoachNotes, setShowEntryCoachNotes] = useState(true)

  useEffect(() => {
    if (!open) {
      setNotice(null)
      setBusy(null)
      setShowEntryCoachNotes(true)
    }
  }, [open])

  const handleDownload = useCallback(async () => {
    const node = captureRef.current
    if (!node) return
    setBusy("download")
    setNotice(null)
    try {
      const blob = await withShareCaptureImagesInlined(
        node,
        "[setlist share png]",
        () => toBlob(node, SETLIST_SHARE_CAPTURE_OPTS),
      )
      if (!blob) {
        setNotice("Could not create image.")
        return
      }
      const name = shareFilename(show)
      const how = await downloadOrWebSharePng(blob, name, {
        shareTitle: `Setlist ${formatSetlistDate(show.show_date)}`,
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
  }, [show])

  const handleCopy = useCallback(async () => {
    const node = captureRef.current
    if (!node) return
    setBusy("copy")
    setNotice(null)
    try {
      const blob = await withShareCaptureImagesInlined(
        node,
        "[setlist share png]",
        () => toBlob(node, SETLIST_SHARE_CAPTURE_OPTS),
      )
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
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          /* Override dialog defaults (`grid` + `w-full`): column flex + fit-content width shrink-wraps the preview card instead of stretching to the viewport. */
          "flex max-h-[min(92vh,900px)] flex-col items-start gap-3 overflow-hidden p-4 sm:p-5",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]",
        )}
      >
        <DialogHeader className="max-w-full gap-1 text-left">
          <DialogTitle className="text-base">
            Setlist image ({formatSetlistDate(show.show_date)})
          </DialogTitle>
          <DialogDescription className="text-xs">
            Preview is {WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX}px wide; height follows the setlist.
            Exported PNG uses {WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO}× pixel density (
            {WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX *
              WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO}
            px wide).
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(62vh,680px)] w-fit max-w-full min-w-0 overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/25 p-2 sm:p-3">
          <div className="inline-block w-min min-w-min shrink-0">
            <WlHomeV2SetlistShareExportCard
              ref={captureRef}
              backgroundSrc={backgroundSrc}
              show={show}
              setlist={setlist}
              showPositionInTour={showPositionInTour}
              showEntryCoachNotes={showEntryCoachNotes}
            />
          </div>
        </div>

        {notice ?
          <p className="text-center text-xs text-muted-foreground">{notice}</p>
        : null}

        <DialogFooter className="w-full flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <div className="flex min-h-11 items-center gap-2 transition-opacity duration-200 ease-out">
            <Checkbox
              id="wl-share-export-entry-coach"
              checked={showEntryCoachNotes}
              disabled={busy !== null}
              onCheckedChange={(checked) =>
                setShowEntryCoachNotes(checked === true)
              }
            />
            <Label
              htmlFor="wl-share-export-entry-coach"
              className="cursor-pointer text-xs font-normal text-muted-foreground"
            >
              Song coach notes
            </Label>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={busy !== null}
              onClick={handleCopy}
            >
              <Copy className="size-3.5" aria-hidden />
              Copy image
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={busy !== null}
              onClick={handleDownload}
            >
              <Download className="size-3.5" aria-hidden />
              Download PNG
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
