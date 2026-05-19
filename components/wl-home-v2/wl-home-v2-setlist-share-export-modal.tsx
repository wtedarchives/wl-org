"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Copy, Download, UploadSimple } from "@phosphor-icons/react"
import { toBlob } from "html-to-image"

import { useAuth } from "@/components/auth-context"
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
import {
  downloadSetlistShareFromStorage,
  setlistShareImageExistsInStorage,
  setlistShareStoragePath,
  uploadSetlistSharePng,
} from "@/lib/setlist-share-upload"

import { WlHomeV2SetlistShareExportCard } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card"
import {
  WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO,
  WL_HOME_V2_SETLIST_SHARE_EXPORT_WIDTH_PX,
} from "@/lib/wl-home-v2-setlist-share-export-config"

/** Set to `false` before ship — when `true`, any signed-in user can use Generate. */
const TEMP_DISABLE_SETLIST_SHARE_UPLOAD_ADMIN_GATE = true

const SETLIST_SHARE_CAPTURE_OPTS = {
  cacheBust: true,
  pixelRatio: WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO,
  backgroundColor: "rgba(0, 0, 0, 0)",
} as const

function shareFilename(show: Show, withEntryCoachNotes: boolean): string {
  const d = formatSetlistDate(show.show_date).replace(/\./g, "-")
  const suffix = withEntryCoachNotes ? "_cn" : ""
  const idPart = show.show_id.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 24)
  return `setlist-${d}-${idPart}${suffix}.png`
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
  const { session } = useAuth()
  const captureRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | "copy" | "download" | "generate">(null)
  const [showEntryCoachNotes, setShowEntryCoachNotes] = useState(true)
  const [storageFileExists, setStorageFileExists] = useState(false)
  const [storageCheckLoading, setStorageCheckLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setNotice(null)
      setBusy(null)
      setShowEntryCoachNotes(true)
      setStorageFileExists(false)
      setStorageCheckLoading(false)
      return
    }

    let cancelled = false
    setStorageCheckLoading(true)
    setlistShareImageExistsInStorage(show.show_id, showEntryCoachNotes).then(
      (exists) => {
        if (cancelled) return
        setStorageFileExists(exists)
        setStorageCheckLoading(false)
      },
    )

    return () => {
      cancelled = true
    }
  }, [open, show.show_id, showEntryCoachNotes])

  const capturePreviewPng = useCallback(async () => {
    const node = captureRef.current
    if (!node) return null
    return toBlob(node, SETLIST_SHARE_CAPTURE_OPTS)
  }, [])

  const handleCopy = useCallback(async () => {
    setBusy("copy")
    setNotice(null)
    try {
      const blob = await capturePreviewPng()
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
        "Copy failed (browser may block clipboard images).",
      )
    } finally {
      setBusy(null)
    }
  }, [capturePreviewPng])

  const handleGenerate = useCallback(async () => {
    if (!session?.token) {
      setNotice("Sign in to upload setlist images.")
      return
    }
    setBusy("generate")
    setNotice(null)
    try {
      const blob = await capturePreviewPng()
      if (!blob) {
        setNotice("Could not create image.")
        return
      }
      const path = setlistShareStoragePath(show.show_id, showEntryCoachNotes)
      const { publicUrl, error } = await uploadSetlistSharePng(
        session.token,
        path,
        blob,
      )
      if (error) {
        setNotice(error)
        return
      }
      setStorageFileExists(true)
      setNotice(
        publicUrl ?
          `Uploaded to setlist-images: ${publicUrl}`
        : `Uploaded to setlist-images (${path}).`,
      )
    } catch (e) {
      console.error(e)
      setNotice("Could not generate or upload image.")
    } finally {
      setBusy(null)
    }
  }, [capturePreviewPng, session?.token, show.show_id, showEntryCoachNotes])

  const handleDownloadFromStorage = useCallback(async () => {
    setBusy("download")
    setNotice(null)
    try {
      const { error } = await downloadSetlistShareFromStorage(
        show.show_id,
        showEntryCoachNotes,
        shareFilename(show, showEntryCoachNotes),
      )
      if (error) {
        setNotice(error)
        return
      }
      setNotice("Download started.")
    } catch (e) {
      console.error(e)
      setNotice("Could not download image.")
    } finally {
      setBusy(null)
    }
  }, [show, showEntryCoachNotes])

  const actionsDisabled = busy !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92vh,900px)] flex-col items-start gap-3 overflow-hidden p-4 sm:p-5",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]",
        )}
      >
        <DialogHeader className="max-w-full gap-1 text-left">
          <DialogTitle className="text-base">
            Setlist Image ({formatSetlistDate(show.show_date)})
          </DialogTitle>
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
              disabled={actionsDisabled}
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
              disabled={actionsDisabled}
              onClick={handleCopy}
            >
              <Copy className="size-3.5" aria-hidden />
              Copy image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={actionsDisabled}
              onClick={handleGenerate}
            >
              <UploadSimple className="size-3.5" aria-hidden />
              Generate
            </Button>
            {storageFileExists && !storageCheckLoading ?
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={actionsDisabled}
                onClick={handleDownloadFromStorage}
              >
                <Download className="size-3.5" aria-hidden />
                Download
              </Button>
            : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
