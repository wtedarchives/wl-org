"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Copy, Download, UploadSimple } from "@phosphor-icons/react"
import { toBlob } from "html-to-image"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
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
import { WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO } from "@/lib/wl-home-v2-setlist-share-export-config"

const SETLIST_SHARE_CAPTURE_OPTS = {
  cacheBust: true,
  pixelRatio: WL_HOME_V2_SETLIST_SHARE_EXPORT_PIXEL_RATIO,
  backgroundColor: "rgba(0, 0, 0, 0)",
} as const

type ShareVariant = "withCoachNotes" | "withoutCoachNotes"

const SHARE_VARIANTS: {
  id: ShareVariant
  label: string
  showEntryCoachNotes: boolean
}[] = [
  {
    id: "withoutCoachNotes",
    label: "Without Coach's Notes",
    showEntryCoachNotes: false,
  },
  {
    id: "withCoachNotes",
    label: "With Coach's Notes",
    showEntryCoachNotes: true,
  },
]

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
  const isMobile = useIsMobile()
  const captureRefWithout = useRef<HTMLDivElement>(null)
  const captureRefWith = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | "copy" | "download" | "generate">(null)
  const [storageExists, setStorageExists] = useState({
    withCoachNotes: false,
    withoutCoachNotes: false,
  })
  const [storageCheckLoading, setStorageCheckLoading] = useState(false)

  const captureRefFor = useCallback((withEntryCoachNotes: boolean) => {
    return withEntryCoachNotes ? captureRefWith : captureRefWithout
  }, [])

  useEffect(() => {
    if (!open) {
      setNotice(null)
      setBusy(null)
      setStorageExists({ withCoachNotes: false, withoutCoachNotes: false })
      setStorageCheckLoading(false)
      return
    }

    let cancelled = false
    setStorageCheckLoading(true)
    Promise.all([
      setlistShareImageExistsInStorage(show.show_id, false),
      setlistShareImageExistsInStorage(show.show_id, true),
    ]).then(([withoutCoachNotes, withCoachNotes]) => {
      if (cancelled) return
      setStorageExists({ withoutCoachNotes, withCoachNotes })
      setStorageCheckLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [open, show.show_id])

  const captureVariantPng = useCallback(async (withEntryCoachNotes: boolean) => {
    const node = captureRefFor(withEntryCoachNotes).current
    if (!node) return null
    return toBlob(node, SETLIST_SHARE_CAPTURE_OPTS)
  }, [captureRefFor])

  const handleCopy = useCallback(
    async (withEntryCoachNotes: boolean) => {
      setBusy("copy")
      setNotice(null)
      try {
        const blob = await captureVariantPng(withEntryCoachNotes)
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
        setNotice("Copy failed (browser may block clipboard images).")
      } finally {
        setBusy(null)
      }
    },
    [captureVariantPng],
  )

  const handleGenerate = useCallback(
    async (withEntryCoachNotes: boolean) => {
      if (!session?.token) {
        setNotice("Sign in to upload setlist images.")
        return
      }
      setBusy("generate")
      setNotice(null)
      try {
        const blob = await captureVariantPng(withEntryCoachNotes)
        if (!blob) {
          setNotice("Could not create image.")
          return
        }
        const path = setlistShareStoragePath(show.show_id, withEntryCoachNotes)
        const { error } = await uploadSetlistSharePng(session.token, path, blob)
        if (error) {
          setNotice(error)
          return
        }
        setStorageExists((prev) =>
          withEntryCoachNotes ?
            { ...prev, withCoachNotes: true }
          : { ...prev, withoutCoachNotes: true },
        )
        setNotice("Image successfully generated.")
      } catch (e) {
        console.error(e)
        setNotice("Could not generate or upload image.")
      } finally {
        setBusy(null)
      }
    },
    [captureVariantPng, session?.token, show.show_id],
  )

  const handleDownloadFromStorage = useCallback(
    async (withEntryCoachNotes: boolean) => {
      setBusy("download")
      setNotice(null)
      try {
        const { error, delivery } = await downloadSetlistShareFromStorage(
          show.show_id,
          withEntryCoachNotes,
          shareFilename(show, withEntryCoachNotes),
          { shareTitle: `Setlist ${formatSetlistDate(show.show_date)}` },
        )
        if (error) {
          setNotice(error)
          return
        }
        setNotice(
          delivery === "shared" ?
            "Share sheet opened — tap Save Image to add to Photos (or share elsewhere)."
          : "Download started.",
        )
      } catch (e) {
        console.error(e)
        setNotice("Could not download image.")
      } finally {
        setBusy(null)
      }
    },
    [show],
  )

  const actionsDisabled = busy !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92vh,900px)] flex-col gap-3 overflow-hidden p-4 sm:p-5",
          "w-fit max-w-[calc(100vw-2rem)]",
          "md:max-w-[min(calc(100vw-2rem),1100px)]",
        )}
      >
        <DialogHeader className="max-w-full gap-1 text-left">
          <DialogTitle className="text-base">
            Setlist Image ({formatSetlistDate(show.show_date)})
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[min(62vh,680px)] w-full min-w-0 overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/25 p-2 sm:p-4">
          <div
            className={cn(
              "flex min-w-0 flex-col items-stretch gap-6",
              "md:flex-row md:items-start md:justify-center",
            )}
          >
            {SHARE_VARIANTS.map((variant) => {
              const storageKey =
                variant.showEntryCoachNotes ? "withCoachNotes" : "withoutCoachNotes"
              const hasStoredFile = storageExists[storageKey]
              const captureRef =
                variant.showEntryCoachNotes ? captureRefWith : captureRefWithout

              return (
                <section
                  key={variant.id}
                  className="flex min-w-0 flex-col items-center gap-2"
                  aria-labelledby={`wl-setlist-share-variant-${variant.id}`}
                >
                  <h3
                    id={`wl-setlist-share-variant-${variant.id}`}
                    className="w-full text-center text-xs font-medium text-muted-foreground"
                  >
                    {variant.label}
                  </h3>
                  <div className="inline-block w-min min-w-min shrink-0">
                    <WlHomeV2SetlistShareExportCard
                      ref={captureRef}
                      backgroundSrc={backgroundSrc}
                      show={show}
                      setlist={setlist}
                      showPositionInTour={showPositionInTour}
                      showEntryCoachNotes={variant.showEntryCoachNotes}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {!isMobile ?
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={actionsDisabled}
                        onClick={() =>
                          void handleCopy(variant.showEntryCoachNotes)
                        }
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
                      disabled={actionsDisabled}
                      onClick={() =>
                        void handleGenerate(variant.showEntryCoachNotes)
                      }
                    >
                      <UploadSimple className="size-3.5" aria-hidden />
                      Generate
                    </Button>
                    {hasStoredFile && !storageCheckLoading ?
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5"
                        disabled={actionsDisabled}
                        onClick={() =>
                          void handleDownloadFromStorage(
                            variant.showEntryCoachNotes,
                          )
                        }
                      >
                        <Download className="size-3.5" aria-hidden />
                        Download
                      </Button>
                    : null}
                  </div>
                </section>
              )
            })}
          </div>
        </div>

        {notice ?
          <p className="w-full text-center text-xs text-muted-foreground">
            {notice}
          </p>
        : null}

      </DialogContent>
    </Dialog>
  )
}
