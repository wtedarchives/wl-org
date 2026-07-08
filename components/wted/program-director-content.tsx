"use client"

import Link from "next/link"
import { useEffect, useId, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useProgramDirectorData } from "@/hooks/use-program-director-data"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { SHOWS_INTRO } from "@/lib/wted-shows-content"
import { Card, CardContent } from "@/components/ui/card"
import { ProgramDirectorShowsSection } from "@/components/wted/program-director-shows-section"
import { WTED_PROGRAM_DIRECTOR_CATALOG_PATH } from "@/lib/wted-program-director-catalog-url"

const PROGRAM_DIRECTOR_LEDE_P1 =
  "WTED Goose Radio features a slate of regularly occurring shows covering a wide range of topics and experiences — from seasonal tour mixes and highlights from special tours like Taboose, to listener-curated shows, events, and partnerships with friends of WTED. Check the schedule on our homepage or in our iOS and Android apps and tune in regularly."

export function ProgramDirectorContent({
  variant = "legacy",
}: {
  variant?: "legacy" | "wl-home-v2"
}) {
  const { shows, loading, error } = useProgramDirectorData()
  const showsWithEpisodes = useMemo(
    () => shows.filter((s) => s.episodes.length > 0),
    [shows],
  )
  const [showInfo, setShowInfo] = useState<{
    showTitle: string
    description: string
  } | null>(null)

  const isV2 = variant === "wl-home-v2"
  const pdShowInfoHeadingId = useId()
  const pdShowInfoDescId = useId()

  useEffect(() => {
    if (!isV2 || showInfo == null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowInfo(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isV2, showInfo])

  useWlHomeV2ScrollLock(isV2 && showInfo != null)

  if (loading) {
    if (isV2) {
      return (
        <WlHomeV2PageLoading message="Loading shows…" />
      )
    }
    return <LoadingPageCard message="Loading shows…" />
  }

  if (error) {
    if (isV2) {
      return (
        <div className="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <div className="widget-panel py-10 text-center">
            <p className="text-sm text-white/65">
              Could not load shows. Please reload the page.
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            Could not load shows. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        isV2 ?
          "flex min-h-0 w-full flex-1 flex-col"
        : "flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden"
      }
    >
      {isV2 ?
        <WlHomeV2ModalPortal open={showInfo != null}>
          <div
            className={"modal-backdrop" + (showInfo != null ? " open" : "")}
            id="pd-show-info-modal"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInfo(null)
            }}
          >
            {showInfo != null ?
              <div
                className="modal modal--wted-request modal--pd-show-info"
                role="dialog"
                aria-modal="true"
                aria-labelledby={pdShowInfoHeadingId}
                aria-describedby={pdShowInfoDescId}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-request-head">
                  <div className="modal-request-head-text">
                    <h3 id={pdShowInfoHeadingId}>{showInfo.showTitle}</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-request-close"
                    onClick={() => setShowInfo(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-request-body">
                  <div className="modal-pd-show-info-scroll">
                    <p
                      id={pdShowInfoDescId}
                      className="modal-pd-show-info-text"
                    >
                      {showInfo.description}
                    </p>
                  </div>
                </div>
              </div>
            : null}
          </div>
        </WlHomeV2ModalPortal>
      : <Dialog
          open={showInfo != null}
          onOpenChange={(open) => {
            if (!open) setShowInfo(null)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{showInfo?.showTitle}</DialogTitle>
            </DialogHeader>
            <p className="text-xs/relaxed whitespace-pre-wrap text-muted-foreground">
              {showInfo?.description}
            </p>
          </DialogContent>
        </Dialog>
      }

      {isV2 ?
        <header className="wl-home-v2-page-lede">
          <h1>WTED Radio Shows</h1>
          <div className="wl-home-v2-page-lede-body">
            <p>{PROGRAM_DIRECTOR_LEDE_P1}</p>
            <p>
              <Link href={WTED_PROGRAM_DIRECTOR_CATALOG_PATH}>Click here</Link>{" "}
              to view the full list of performances that have been chosen for shows airing on WTED Radio.
            </p>
            <p>
              Have an idea or want to contribute? Become a GORP (Goose Obsessed
              Radio Personality) over at the{" "}
              <Link
                href={SHOWS_INTRO.communityUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {SHOWS_INTRO.communityLabel}
              </Link>{" "}
              — the limits of WTED are driven only by the creativity of listeners
              like you.
            </p>
          </div>
        </header>
      : <div className="mb-1 w-full">
          <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm py-0">
            <div className="bg-muted/60 flex min-w-0 flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="shrink-0 text-sm font-semibold">
                  WTED Radio Shows
                </h1>
              </div>
            </div>
            <CardContent className="border-t border-border/40 bg-muted/20 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
              <div className="space-y-4">
                <p>{PROGRAM_DIRECTOR_LEDE_P1}</p>
                <p>
                  <Link
                    href={WTED_PROGRAM_DIRECTOR_CATALOG_PATH}
                    className="font-medium text-foreground hover:underline"
                  >
                    Click here
                  </Link>{" "}
                  to view the full list of performances that have been chosen for shows airing on WTED Radio.
                </p>
                <p>
                  Have an idea or want to contribute? Become a GORP (Goose Obsessed
                  Radio Personality) over at the{" "}
                  <Link
                    href={SHOWS_INTRO.communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:underline"
                  >
                    {SHOWS_INTRO.communityLabel}
                  </Link>{" "}
                  — the limits of WTED are driven only by the creativity of
                  listeners like you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      }

      <ProgramDirectorShowsSection
        isV2={isV2}
        showsWithEpisodes={showsWithEpisodes}
        onOpenShowInfo={(showTitle, description) =>
          setShowInfo({ showTitle, description })
        }
      />
    </div>
  )
}
